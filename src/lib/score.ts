// 가성비 점수 (100점 만점). 가중치·구간은 이 파일 한 곳에서만 조정한다.
// null 입력이 있는 항목은 제외하고 나머지 가중치를 재분배한다. 전부 null이면 total = null.

export const SCORE_WEIGHTS = { price: 0.4, climate: 0.3, theme: 0.2, access: 0.1 } as const;

export const SCORE_PARAMS = {
  /** 지역 평균 대비 비용 비율: ratioBest 이하 100점, ratioWorst 이상 0점 (선형) */
  ratioBest: 0.6,
  ratioWorst: 1.6,
  /** 쾌적 기온(일 평균=(최저+최고)/2) 구간: 안이면 100점, 벗어나면 도당 감점 */
  comfortMin: 18,
  comfortMax: 27,
  tempPenaltyPerDeg: 6,
  /** 월 강수량 rainFreeMm 초과분 mm당 감점, 최대 rainMaxPenalty */
  rainFreeMm: 100,
  rainPenaltyPerMm: 0.25,
  rainMaxPenalty: 40,
  themeCap: 4,
  landmarkCap: 5,
  /** 비행시간 flightBestH 이하 100점, flightWorstH 이상 0점 */
  flightBestH: 3,
  flightWorstH: 14,
  flightShareOfAccess: 0.8,
} as const;

export type ScoreInput = {
  /** 항공 + 현지 경비 × 박수 (대표값). 모르면 null */
  totalCost: number | null;
  /** 같은 지역 도시들의 같은 기준 평균 비용. 모르면 null */
  regionAvgCost: number | null;
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainfallMm: number | null;
  themeCount: number | null;
  landmarkCount: number | null;
  flightHours: number | null;
  visaRequired: boolean | null;
};

export type ScoreParts = {
  price: number | null;
  climate: number | null;
  theme: number | null;
  access: number | null;
};
export type ScoreResult = {
  total: number | null;
  parts: ScoreParts;
  /** 실제 적용된 (재분배 후) 가중치. null 항목은 0 */
  weights: Record<keyof ScoreParts, number>;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const has = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n);

export function priceScore(totalCost: number | null, regionAvg: number | null): number | null {
  if (!has(totalCost) || !has(regionAvg) || regionAvg <= 0 || totalCost < 0) return null;
  const { ratioBest, ratioWorst } = SCORE_PARAMS;
  const ratio = totalCost / regionAvg;
  return clamp(((ratioWorst - ratio) / (ratioWorst - ratioBest)) * 100);
}

export function climateScore(
  min: number | null,
  max: number | null,
  rainMm: number | null,
): number | null {
  if (!has(min) || !has(max)) return null;
  const p = SCORE_PARAMS;
  const mean = (min + max) / 2;
  const off =
    mean < p.comfortMin ? p.comfortMin - mean : mean > p.comfortMax ? mean - p.comfortMax : 0;
  let score = 100 - off * p.tempPenaltyPerDeg;
  if (has(rainMm))
    score -= clamp((rainMm - p.rainFreeMm) * p.rainPenaltyPerMm, 0, p.rainMaxPenalty);
  return clamp(score);
}

export function themeScore(themeCount: number | null, landmarkCount: number | null): number | null {
  const p = SCORE_PARAMS;
  const parts: number[] = [];
  if (has(themeCount)) parts.push(clamp((themeCount / p.themeCap) * 100));
  if (has(landmarkCount)) parts.push(clamp((landmarkCount / p.landmarkCap) * 100));
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
}

export function accessScore(
  flightHours: number | null,
  visaRequired: boolean | null,
): number | null {
  const p = SCORE_PARAMS;
  const flight = has(flightHours)
    ? clamp(((p.flightWorstH - flightHours) / (p.flightWorstH - p.flightBestH)) * 100)
    : null;
  const visa = visaRequired === null ? null : visaRequired ? 0 : 100;
  if (flight === null && visa === null) return null;
  if (flight === null) return visa;
  if (visa === null) return flight;
  return flight * p.flightShareOfAccess + visa * (1 - p.flightShareOfAccess);
}

export function computeScore(i: ScoreInput): ScoreResult {
  const parts: ScoreParts = {
    price: priceScore(i.totalCost, i.regionAvgCost),
    climate: climateScore(i.avgTempMin, i.avgTempMax, i.rainfallMm),
    theme: themeScore(i.themeCount, i.landmarkCount),
    access: accessScore(i.flightHours, i.visaRequired),
  };
  const keys = Object.keys(parts) as (keyof ScoreParts)[];
  const active = keys.filter((k) => parts[k] !== null);
  const sum = active.reduce((a, k) => a + SCORE_WEIGHTS[k], 0);
  const weights = Object.fromEntries(
    keys.map((k) => [k, parts[k] === null ? 0 : SCORE_WEIGHTS[k] / sum]),
  ) as Record<keyof ScoreParts, number>;
  if (!active.length) return { total: null, parts, weights };
  const total = active.reduce((a, k) => a + (parts[k] as number) * weights[k], 0);
  return { total: Math.round(total), parts, weights };
}
