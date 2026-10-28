// 가성비 점수 (100점 만점). 가중치·구간은 이 파일 한 곳에서만 조정한다.
// 점수는 사용자 조건(월·박수·선호 기온·비 회피)에 따라 브라우저에서 계산한다.
// null 입력이 있는 항목은 제외하고 나머지 가중치를 비례 재분배한다. 전부 null이면 total = null.
import type { DestinationView } from './data';
import type { Prefs } from './prefs';
import { tripTotal, type PeerStats } from './trip';

export const SCORE_WEIGHTS = { price: 0.4, climate: 0.3, theme: 0.2, access: 0.1 } as const;

export const SCORE_PARAMS = {
  /** 비교 평균 대비 총비용 비율: ratioBest 이하 100점, ratioWorst 이상 0점 (선형) */
  ratioBest: 0.6,
  ratioWorst: 1.6,
  /** 선호 기온 범위를 벗어난 1℃마다 감점 (일평균 = (최저+최고)/2) */
  tempPenaltyPerDeg: 6,
  /** 월 강수량 rainFreeMm 초과분 mm당 감점, 최대 rainMaxPenalty. '비 피하기'면 2배 */
  rainFreeMm: 100,
  rainPenaltyPerMm: 0.25,
  rainMaxPenalty: 40,
  rainAvoidFactor: 2,
  /** 테마 수 themeCap 이상이면 100점 */
  themeCap: 4,
  /**
   * 이동 부담 = 왕복 비행시간 ÷ 전체 여행시간((박수+1)×24h).
   * burdenBest 이하 100점, burdenWorst 이상 0점 → 멀리 가도 오래 머물면 부담이 줄어든다.
   */
  burdenBest: 0.05,
  burdenWorst: 0.25,
  flightShareOfAccess: 0.8,
  /** 입국 요건별 점수: 무비자 / 전자여행허가 / 비자·도착비자 */
  visaScore: { free: 100, eta: 70, visa: 0 },
  /** 같은 지역 비교 도시가 이보다 적으면 전체 평균과 비교 */
  minRegionPeers: 3,
} as const;

export type VisaKind = 'free' | 'eta' | 'visa';

export type ScoreInput = {
  /** 항공 + 현지 경비 × 박수 (대표값). 모르면 null */
  totalCost: number | null;
  /** 같은 조건의 비교 평균 비용. 모르면 null */
  regionAvgCost: number | null;
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainfallMm: number | null;
  themeCount: number | null;
  flightHours: number | null;
  visaKind: VisaKind | null;
  nights: number;
  comfortMin: number;
  comfortMax: number;
  rainAvoid: boolean;
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
const lerp = (v: number, best: number, worst: number) =>
  clamp(((worst - v) / (worst - best)) * 100);

export function priceScore(totalCost: number | null, avgCost: number | null): number | null {
  if (!has(totalCost) || !has(avgCost) || avgCost <= 0 || totalCost < 0) return null;
  return lerp(totalCost / avgCost, SCORE_PARAMS.ratioBest, SCORE_PARAMS.ratioWorst);
}

export function climateScore(
  min: number | null,
  max: number | null,
  rainMm: number | null,
  pref: { comfortMin: number; comfortMax: number; rainAvoid: boolean } = {
    comfortMin: 18,
    comfortMax: 27,
    rainAvoid: false,
  },
): number | null {
  if (!has(min) || !has(max)) return null;
  const p = SCORE_PARAMS;
  const mean = (min + max) / 2;
  const off =
    mean < pref.comfortMin
      ? pref.comfortMin - mean
      : mean > pref.comfortMax
        ? mean - pref.comfortMax
        : 0;
  let score = 100 - off * p.tempPenaltyPerDeg;
  if (has(rainMm)) {
    const factor = pref.rainAvoid ? p.rainAvoidFactor : 1;
    score -= clamp(
      (rainMm - p.rainFreeMm) * p.rainPenaltyPerMm * factor,
      0,
      p.rainMaxPenalty * factor,
    );
  }
  return clamp(score);
}

export function themeScore(themeCount: number | null): number | null {
  return has(themeCount) ? clamp((themeCount / SCORE_PARAMS.themeCap) * 100) : null;
}

/** 이동 부담 비율 (왕복 비행시간 ÷ 여행 전체 시간) */
export const travelBurden = (flightHours: number, nights: number) =>
  (flightHours * 2) / ((nights + 1) * 24);

export function accessScore(
  flightHours: number | null,
  visaKind: VisaKind | null,
  nights = 4,
): number | null {
  const p = SCORE_PARAMS;
  const flight = has(flightHours)
    ? lerp(travelBurden(flightHours, nights), p.burdenBest, p.burdenWorst)
    : null;
  const visa = visaKind === null ? null : p.visaScore[visaKind];
  if (flight === null && visa === null) return null;
  if (flight === null) return visa;
  if (visa === null) return flight;
  return flight * p.flightShareOfAccess + visa * (1 - p.flightShareOfAccess);
}

export function computeScore(i: ScoreInput): ScoreResult {
  const parts: ScoreParts = {
    price: priceScore(i.totalCost, i.regionAvgCost),
    climate: climateScore(i.avgTempMin, i.avgTempMax, i.rainfallMm, i),
    theme: themeScore(i.themeCount),
    access: accessScore(i.flightHours, i.visaKind, i.nights),
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

/** 항목별 획득 점수/만점 (카드·상세 표시용). 제외 항목은 null */
export function scorePoints(r: ScoreResult) {
  const keys = Object.keys(r.parts) as (keyof ScoreParts)[];
  return keys.map((k) => ({
    key: k,
    got: r.parts[k] === null ? null : Math.round((r.parts[k] as number) * r.weights[k]),
    max: Math.round(r.weights[k] * 100),
  }));
}

export type DestinationScore = ScoreResult & {
  totalCost: number | null;
  /** 가격 점수의 비교 기준 */
  priceBasis: 'region' | 'all' | null;
};

/** 사용자 조건으로 한 도시의 해당 월 점수를 계산 */
export function scoreDestination(
  d: DestinationView,
  prefs: Prefs,
  peers: PeerStats,
): DestinationScore {
  const m = d.months[prefs.month - 1];
  const totalCost = tripTotal(m.flight, m.dailyCost.total, prefs.nights);
  const stat = peers[prefs.month]?.[prefs.nights];
  const regionAvg = stat?.region[d.region] ?? null;
  const avg = regionAvg ?? stat?.all ?? null;
  const result = computeScore({
    totalCost,
    regionAvgCost: avg,
    avgTempMin: m.avgTempMin,
    avgTempMax: m.avgTempMax,
    rainfallMm: m.rainfallMm,
    themeCount: d.themes.length,
    flightHours: d.flightHours.ICN,
    visaKind: d.visaInfo.kind,
    nights: prefs.nights,
    comfortMin: prefs.tMin,
    comfortMax: prefs.tMax,
    rainAvoid: prefs.rainAvoid,
  });
  return {
    ...result,
    totalCost,
    priceBasis: result.parts.price === null ? null : regionAvg !== null ? 'region' : 'all',
  };
}
