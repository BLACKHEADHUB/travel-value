// 자유여행 vs 패키지 비교. 판정은 단정하지 않고 범위로 표현한다.
import type { PackageTour } from './schema';

export type Range = { min: number; max: number };

export type FreeTripInput = {
  flightMin: number | null;
  flightMax: number | null;
  dailyCost: number | null;
  nights: number;
};

/** 자유여행 총비용 = 항공 + 1일 경비 × 박수. 하나라도 모르면 null */
export function freeTripCost(i: FreeTripInput): Range | null {
  if (i.flightMin === null || i.flightMax === null || i.dailyCost === null) return null;
  if (i.nights < 1 || i.flightMin > i.flightMax) return null;
  const stay = i.dailyCost * i.nights;
  return { min: i.flightMin + stay, max: i.flightMax + stay };
}

export type PackageStats = {
  status: 'ok' | 'insufficient' | 'none';
  /** 통계에 사용된 상품 수 */
  count: number;
  min: number | null;
  median: number | null;
  /** 통계 대상 상품들의 알려진 추가비용 중앙값(없으면 0) */
  extraKnown: number;
  /** 추가 비용이 더 발생할 수 있음 (유류할증료 미포함/불포함 금액 불명 등) */
  extraUnknown: boolean;
  /** 박수 불일치로 제외된 수 */
  excludedNightsMismatch: number;
  /** 조건 불명확(termsClear=false)으로 제외된 수 */
  excludedUnclear: number;
};

const MIN_SAMPLES = 2;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function packageStats(pkgs: PackageTour[], month: number, nights: number): PackageStats {
  const inMonth = pkgs.filter((p) => p.departureMonth === month);
  const excludedUnclear = inMonth.filter((p) => !p.termsClear).length;
  const clear = inMonth.filter((p) => p.termsClear);
  const matched = clear.filter((p) => p.nights === nights);
  const base = {
    excludedNightsMismatch: clear.length - matched.length,
    excludedUnclear,
  };
  if (!matched.length) {
    return {
      status: 'none',
      count: 0,
      min: null,
      median: null,
      extraKnown: 0,
      extraUnknown: false,
      ...base,
    };
  }
  const prices = matched.map((p) => p.priceKRW);
  const known = matched.map((p) => p.extraKnownKRW ?? 0);
  const extraUnknown = matched.some(
    (p) =>
      p.priceIncludesFuelSurcharge !== true || (p.excluded.length > 0 && p.extraKnownKRW === null),
  );
  return {
    status: matched.length >= MIN_SAMPLES ? 'ok' : 'insufficient',
    count: matched.length,
    min: Math.min(...prices),
    median: median(prices),
    extraKnown: median(known),
    extraUnknown,
    ...base,
  };
}

export type Verdict = {
  kind: 'package' | 'free' | 'similar' | 'unknown';
  /** 양수 범위(원). kind가 similar/unknown이면 null */
  lowKRW: number | null;
  highKRW: number | null;
  text: string;
};

const toMan = (krw: number) => Math.max(1, Math.round(krw / 10000));

export function verdict(free: Range | null, stats: PackageStats): Verdict {
  if (!free)
    return {
      kind: 'unknown',
      lowKRW: null,
      highKRW: null,
      text: '자유여행 비용 정보가 부족해 비교할 수 없어요.',
    };
  if (stats.status !== 'ok' || stats.min === null || stats.median === null) {
    const why =
      stats.status === 'insufficient' ? '패키지 샘플이 2개 미만이라' : '비교할 패키지 정보가 없어';
    return { kind: 'unknown', lowKRW: null, highKRW: null, text: `${why} 판정을 보류해요.` };
  }
  const pkgLow = stats.min + stats.extraKnown;
  const pkgHigh = stats.median + stats.extraKnown;
  // 자유여행 - 패키지: 양수면 패키지가 저렴
  const diffLow = free.min - pkgHigh;
  const diffHigh = free.max - pkgLow;
  const extra = stats.extraUnknown ? ' (패키지는 추가 비용이 더 발생할 수 있어요)' : '';
  if (diffLow > 0) {
    return {
      kind: 'package',
      lowKRW: diffLow,
      highKRW: diffHigh,
      text: `패키지가 약 ${toMan(diffLow)}~${toMan(diffHigh)}만 원 저렴할 수 있어요${extra}.`,
    };
  }
  if (diffHigh < 0) {
    return {
      kind: 'free',
      lowKRW: -diffHigh,
      highKRW: -diffLow,
      text: `자유여행이 약 ${toMan(-diffHigh)}~${toMan(-diffLow)}만 원 저렴할 수 있어요${extra}.`,
    };
  }
  return {
    kind: 'similar',
    lowKRW: null,
    highKRW: null,
    text: `두 방식의 비용이 비슷한 범위예요${extra}.`,
  };
}
