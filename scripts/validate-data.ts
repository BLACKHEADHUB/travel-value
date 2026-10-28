// data/ 전체 검증: zod 스키마 + 논리·이상치 검사. 오류는 exit 1, 경고는 출력만.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ZodType } from 'zod';
import {
  climateFileSchema,
  destinationFileSchema,
  packageFileSchema,
  type ClimateFile,
  type Destination,
  type PackageTour,
} from '../src/lib/schema';
import { freeTripCost } from '../src/lib/compare';

const root = join(process.cwd(), 'data');
const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

function load<T>(dir: string, schema: ZodType<T>): Map<string, T> {
  const out = new Map<string, T>();
  const p = join(root, dir);
  if (!existsSync(p)) return out;
  for (const f of readdirSync(p).filter((x) => x.endsWith('.json'))) {
    const region = f.replace('.json', '');
    const r = schema.safeParse(JSON.parse(readFileSync(join(p, f), 'utf8')));
    if (!r.success) {
      for (const i of r.error.issues.slice(0, 20))
        err(`${dir}/${f} ${i.path.join('.')}: ${i.message}`);
      continue;
    }
    out.set(region, r.data);
  }
  return out;
}

const destFiles = load<Destination[]>('destinations', destinationFileSchema);
const climateFiles = load<ClimateFile>('climate', climateFileSchema);
const pkgFiles = load<PackageTour[]>('packages', packageFileSchema);

// 범위 (이상치 기준)
const LIMITS = {
  temp: [-40, 48],
  rain: [0, 1500],
  flight: [50_000, 5_000_000],
  daily: [10_000, 1_000_000],
  flightHours: [0.5, 20],
  nights: [2, 10],
} as const;
const out = (n: number, [lo, hi]: readonly [number, number]) => n < lo || n > hi;

const ids = new Set<string>();
const allDest = new Map<string, Destination>();

for (const [region, dests] of destFiles) {
  for (const d of dests) {
    const at = `${region}/${d.id}`;
    if (ids.has(d.id)) err(`${at}: 중복 id`);
    ids.add(d.id);
    allDest.set(d.id, d);
    if (d.region !== region) err(`${at}: region(${d.region})이 파일명과 다름`);
    if (d.imageUrl && !d.imageCredit) err(`${at}: 이미지 출처(imageCredit) 누락`);
    if (!d.imageUrl) warn(`${at}: 이미지 없음`);
    if (d.flightHours.ICN !== null && out(d.flightHours.ICN, LIMITS.flightHours))
      err(`${at}: flightHours.ICN 이상치 ${d.flightHours.ICN}`);
    if (d.visaInfo.required !== null && !d.visaInfo.source) warn(`${at}: 비자 정보 출처 없음`);

    const tp = d.flightPriceTypical;
    if (tp.min !== null && tp.max !== null && tp.min > tp.max) err(`${at}: 연중 대표가 min > max`);
    for (const v of [tp.min, tp.max])
      if (v !== null && out(v, LIMITS.flight)) err(`${at}: 연중 대표가 이상치 ${v}`);
    if ((tp.min !== null || tp.max !== null) && (!tp.source || !tp.asOf))
      err(`${at}: 연중 대표가 source/asOf 누락`);

    const months = d.monthly.map((m) => m.month).sort((a, b) => a - b);
    if (months.join() !== '1,2,3,4,5,6,7,8,9,10,11,12') err(`${at}: 12개월(1~12) 데이터가 아님`);

    for (const m of d.monthly) {
      const am = `${at} ${m.month}월`;
      const fp = m.flightPrice;
      if (fp.min !== null && fp.max !== null && fp.min > fp.max) err(`${am}: 항공 min > max`);
      for (const v of [fp.min, fp.max])
        if (v !== null && out(v, LIMITS.flight)) err(`${am}: 항공값 이상치 ${v}`);
      if ((fp.min !== null || fp.max !== null) && (!fp.source || !fp.asOf))
        err(`${am}: 항공값 source/asOf 누락`);
      const dc = m.dailyCost;
      if (dc.total !== null && out(dc.total, LIMITS.daily))
        err(`${am}: 1일 경비 이상치 ${dc.total}`);
      const anyCost = [dc.total, dc.lodging, dc.food, dc.transport].some((v) => v !== null);
      if (anyCost && (!dc.source || !dc.asOf)) err(`${am}: 경비 source/asOf 누락`);
      if (dc.local && !dc.fx) {
        // 수집 중(병렬)에는 VALIDATE_SKIP_FX=1 로 경고만, 최종 검증은 오류
        (process.env.VALIDATE_SKIP_FX ? warn : err)(
          `${am}: 현지 통화 경비가 환산되지 않음 (npm run fx)`,
        );
      }
      if (dc.local?.total && dc.fx && dc.total !== null) {
        const expect = dc.local.total * dc.fx.rate;
        if (Math.abs(expect - dc.total) / expect > 0.01)
          err(`${am}: 경비 KRW(${dc.total})가 현지값×환율(${Math.round(expect)})과 다름`);
      }
      if (dc.total !== null && [dc.lodging, dc.food, dc.transport].every((v) => v !== null)) {
        const sum = (dc.lodging ?? 0) + (dc.food ?? 0) + (dc.transport ?? 0);
        if (Math.abs(sum - dc.total) / dc.total > 0.15)
          warn(`${am}: 경비 합계(${sum})와 total(${dc.total}) 불일치`);
      }
    }
  }
}

// 기후: 스크립트 생성물과 도시 일치 + 물리적 타당성
for (const [region, dests] of destFiles) {
  const c = climateFiles.get(region);
  for (const d of dests) {
    const rows = c?.cities[d.id];
    if (!rows) {
      err(`${region}/${d.id}: 기후 데이터 없음 (npm run fetch:climate ${region})`);
      continue;
    }
    for (const r of rows) {
      const am = `${region}/${d.id} ${r.month}월`;
      if (r.avgTempMin > r.avgTempMax) err(`${am}: 기온 min > max`);
      if (out(r.avgTempMin, LIMITS.temp) || out(r.avgTempMax, LIMITS.temp))
        err(`${am}: 기온 이상치`);
      if (out(r.rainfallMm, LIMITS.rain)) err(`${am}: 강수 이상치 ${r.rainfallMm}`);
    }
  }
}

// 패키지
const PKG_NIGHTS_DEFAULT = 4;
for (const [region, pkgs] of pkgFiles) {
  pkgs.forEach((p, i) => {
    const at = `packages/${region}[${i}] ${p.destinationId}`;
    const d = allDest.get(p.destinationId);
    if (!d) return err(`${at}: 존재하지 않는 destinationId`);
    if (d.region !== region) err(`${at}: 도시 지역(${d.region})과 파일 불일치`);
    if (out(p.nights, LIMITS.nights)) warn(`${at}: 박수 범위 밖 ${p.nights}박`);
    if (!p.termsClear) warn(`${at}: 조건 불명확(통계 제외)`);
    if (p.departureDate && p.departureDate < p.asOf)
      warn(`${at}: 출발일(${p.departureDate})이 기준일보다 과거 — 지난 가격`);
    const m = d.monthly.find((x) => x.month === p.departureMonth);
    const free = m
      ? freeTripCost({
          flightMin: m.flightPrice.min,
          flightMax: m.flightPrice.max,
          dailyCost: m.dailyCost.total,
          nights: p.nights || PKG_NIGHTS_DEFAULT,
        })
      : null;
    if (free) {
      const mid = (free.min + free.max) / 2;
      const ratio = p.priceKRW / mid;
      if (ratio < 0.25 || ratio > 4)
        warn(
          `${at}: 가격 ${p.priceKRW}원이 자유여행 추정(${Math.round(mid)}원) 대비 극단값(x${ratio.toFixed(2)})`,
        );
    }
  });
}

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
const nPkg = [...pkgFiles.values()].reduce((a, x) => a + x.length, 0);
console.log(
  `destinations ${allDest.size}개, packages ${nPkg}개, 경고 ${warnings.length}, 오류 ${errors.length}`,
);
if (errors.length) process.exit(1);
