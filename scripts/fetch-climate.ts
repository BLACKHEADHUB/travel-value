// 기온·강수 월평균을 Open-Meteo 과거 데이터(ERA5)에서 계산해 data/climate/<region>.json 생성.
// 사용: npm run fetch:climate [-- <region> ...]   (직접 수정 금지, 다시 돌리면 갱신)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { destinationFileSchema, type ClimateFile } from '../src/lib/schema';

const YEARS = [2019, 2020, 2021, 2022, 2023];
const root = process.cwd();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Daily = {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
};

async function fetchDaily(lat: number, lng: number): Promise<Daily> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
    `&start_date=${YEARS[0]}-01-01&end_date=${YEARS[YEARS.length - 1]}-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) return ((await res.json()) as { daily: Daily }).daily;
    if (res.status === 429 || res.status >= 500) await sleep(attempt * 15000);
    else throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  }
  throw new Error('Open-Meteo: 재시도 초과');
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n: number) => Math.round(n * 10) / 10;

function monthly(d: Daily) {
  return Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, '0');
    const tmax: number[] = [];
    const tmin: number[] = [];
    const rainByYear = new Map<string, number>();
    d.time.forEach((t, k) => {
      if (t.slice(5, 7) !== mm) return;
      const hi = d.temperature_2m_max[k];
      const lo = d.temperature_2m_min[k];
      const p = d.precipitation_sum[k];
      if (hi != null) tmax.push(hi);
      if (lo != null) tmin.push(lo);
      if (p != null) rainByYear.set(t.slice(0, 4), (rainByYear.get(t.slice(0, 4)) ?? 0) + p);
    });
    return {
      month: i + 1,
      avgTempMin: r1(mean(tmin)), // 일 최저기온의 월평균
      avgTempMax: r1(mean(tmax)), // 일 최고기온의 월평균
      rainfallMm: Math.round(mean([...rainByYear.values()])), // 연도별 월 강수합의 평균
    };
  });
}

async function main() {
  const only = process.argv.slice(2);
  const dir = join(root, 'data', 'destinations');
  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.json') && (!only.length || only.includes(f.replace('.json', ''))),
  );
  for (const f of files) {
    const dests = destinationFileSchema.parse(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    const out: ClimateFile = {
      source: 'Open-Meteo Historical Weather API (ERA5), 도시 좌표 기준 월평균',
      years: YEARS,
      generatedAt: new Date().toISOString().slice(0, 10),
      cities: {},
    };
    for (const d of dests) {
      console.log(`  ${d.id} ...`);
      out.cities[d.id] = monthly(await fetchDaily(d.coordinates.lat, d.coordinates.lng));
      await sleep(1500);
    }
    writeFileSync(join(root, 'data', 'climate', f), JSON.stringify(out, null, 2) + '\n');
    console.log(`data/climate/${f} 생성 (${dests.length}개 도시)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
