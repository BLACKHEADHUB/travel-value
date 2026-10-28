// 항공·총비용 계산 (서버·브라우저 공용, fs 사용 금지)
import type { Destination } from './schema';

export const MIN_NIGHTS = 1;
export const MAX_NIGHTS = 13; // 최대 2주(13박 14일)
export const DEFAULT_NIGHTS = 4;

/** 해당 월 항공가. 월별 값이 없으면 연중 대표가로 대체하고 typical=true */
export function flightFor(
  d: Pick<Destination, 'flightPriceTypical'>,
  m: Destination['monthly'][number],
) {
  const monthly = m.flightPrice;
  if (monthly.min !== null || monthly.max !== null) {
    // 한쪽만 있으면(월 중간값 등) 같은 값으로 취급
    const v = { min: monthly.min ?? monthly.max, max: monthly.max ?? monthly.min };
    return { ...monthly, ...v, typical: false };
  }
  const t = d.flightPriceTypical;
  if (t.min !== null && t.max !== null) return { ...t, typical: true };
  return { ...monthly, typical: false };
}

/** 대표 총비용 = 항공 중간값 + 1일 경비 × 박수. 모르면 null */
export function tripTotal(
  flight: { min: number | null; max: number | null },
  dailyCost: number | null,
  nights: number,
): number | null {
  if (flight.min === null || flight.max === null || dailyCost === null) return null;
  return Math.round((flight.min + flight.max) / 2 + dailyCost * nights);
}

/** 월·박수별 비교 기준 평균 (빌드 시 data.ts가 계산) */
export type PeerStats = Record<
  number, // month
  Record<number, { all: number | null; region: Record<string, number | null> }> // nights
>;
