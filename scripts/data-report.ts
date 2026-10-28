// 데이터 품질 리포트 → docs/DATA_REPORT.md. 사용: npm run data:report
// 확인값 = confidence high/medium, 추정값 = low, 정보 없음 = null
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadDestinations } from '../src/lib/data';
import { REGION_LABEL } from '../src/lib/themes';

type Conf = 'high' | 'medium' | 'low';
const all = loadDestinations();
const tally = () => ({ high: 0, medium: 0, low: 0, none: 0 });
const add = (t: ReturnType<typeof tally>, has: boolean, c: Conf) => (has ? t[c]++ : t.none++);

const monthlyFlight = tally();
const typicalFlight = tally();
const dailyCost = tally();
const lowItems: string[] = [];

for (const d of all) {
  const tp = d.flightPriceTypical;
  add(typicalFlight, tp.min !== null, tp.confidence);
  if (tp.min !== null && tp.confidence === 'low') lowItems.push(`${d.nameKo}: 연중 대표 항공가`);
  let lowCost = false;
  let lowFlight = 0;
  for (const m of d.months) {
    const hasF = m.flightPrice.min !== null || m.flightPrice.max !== null;
    add(monthlyFlight, hasF, m.flightPrice.confidence);
    if (hasF && m.flightPrice.confidence === 'low') lowFlight++;
    const hasC = m.dailyCost.total !== null;
    add(dailyCost, hasC, m.dailyCost.confidence);
    if (hasC && m.dailyCost.confidence === 'low') lowCost = true;
  }
  if (lowCost) lowItems.push(`${d.nameKo}: 1일 경비`);
  if (lowFlight) lowItems.push(`${d.nameKo}: 월별 항공 ${lowFlight}개월`);
}

const row = (name: string, t: ReturnType<typeof tally>) => {
  const total = t.high + t.medium + t.low + t.none;
  const known = t.high + t.medium;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return `| ${name} | ${total} | ${known} (${pct(known)}) | ${t.low} (${pct(t.low)}) | ${t.none} (${pct(t.none)}) |`;
};

const pkgCities = all.filter((d) => d.packages.length);
const clearCount = (d: (typeof all)[number]) => d.packages.filter((p) => p.termsClear).length;
const comparable = all.filter((d) => clearCount(d) >= 2);
const thin = all.filter((d) => clearCount(d) < 2);
const noCost = all.filter((d) => d.months.every((m) => m.dailyCost.total === null));
const noImage = all.filter((d) => !d.imageUrl);
const noVisaSrc = all.filter((d) => !d.visaInfo.source);

const md = `# 데이터 품질 리포트

생성: ${new Date().toISOString().slice(0, 10)} · \`npm run data:report\`로 다시 생성

도시 ${all.length}곳 (${Object.entries(REGION_LABEL)
  .map(([r, l]) => `${l} ${all.filter((d) => d.region === r).length}`)
  .join(' · ')})

## 확인값 vs 추정값

확인값 = 출처가 수치를 직접 제시(confidence high/medium), 추정값 = 2차 출처·검색 요약·범위 기반(low), 정보 없음 = null(지어내지 않음).

| 항목 | 칸 수 | 확인값 | 추정값 | 정보 없음 |
|---|---|---|---|---|
${row('월별 왕복 항공가', monthlyFlight)}
${row('연중 대표 항공가', typicalFlight)}
${row('1일 현지 경비', dailyCost)}

기온·강수는 Open-Meteo ERA5(2019–2023) 월평균을 스크립트로 계산(직접 입력 없음, 격자 평균이라 해안·고지대 편차 가능).

## 신뢰도 낮은(low) 데이터

${lowItems.length ? lowItems.map((x) => `- ${x}`).join('\n') : '- 없음'}

## 빈 곳

- 1일 경비 없는 도시 ${noCost.length}곳: ${noCost.map((d) => d.nameKo).join(', ') || '없음'}
- 이미지 없는 도시 ${noImage.length}곳: ${noImage.map((d) => d.nameKo).join(', ') || '없음'}
- 비자 출처 없는 도시 ${noVisaSrc.length}곳: ${noVisaSrc.map((d) => d.nameKo).join(', ') || '없음'}

## 패키지

- 패키지 데이터 확보 도시: ${pkgCities.length}/${all.length}곳 (상품 ${all.reduce((a, d) => a + d.packages.length, 0)}개, 포함/불포함 확인 ${all.reduce((a, d) => a + clearCount(d), 0)}개)
- 자유여행 vs 패키지 판정 가능(조건 확인 상품 2개 이상): ${comparable.length}곳${comparable.length ? ` — ${comparable.map((d) => d.nameKo).join(', ')}` : ''}
- 샘플 부족(조건 확인 상품 2개 미만) 도시 ${thin.length}곳: ${thin.map((d) => `${d.nameKo}(${d.packages.length}개 중 ${clearCount(d)})`).join(', ')}
`;

writeFileSync(join(process.cwd(), 'docs', 'DATA_REPORT.md'), md);
console.log(md);
