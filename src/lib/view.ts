// UI 판단 규칙 (데이터 해석). 점수 계산은 score.ts에만 둔다.
import type { DestinationView, MonthView } from './data';

/** 월 강수량이 이 이상이면 '우기/비 많음'으로 표시 */
export const RAINY_MM = 150;
export const isRainy = (m: MonthView) => m.rainfallMm !== null && m.rainfallMm >= RAINY_MM;
export const meanTemp = (m: MonthView) =>
  m.avgTempMin === null || m.avgTempMax === null ? null : (m.avgTempMin + m.avgTempMax) / 2;

/** 비행시간 기반 추천 일정 */
export function recommendedTrip(d: Pick<DestinationView, 'flightHours'>): string {
  const h = d.flightHours.ICN;
  if (h === null) return NA_TRIP;
  if (h <= 4) return '2박 3일 ~ 3박 4일';
  if (h <= 7) return '3박 5일 ~ 4박 6일';
  if (h <= 10) return '5박 7일 이상';
  return '7박 9일 이상';
}
const NA_TRIP = '정보 없음';

/** 다음에 오는 해당 월 15일 (오늘이 그 달 15일 이후면 내년) */
export function nextDate(month: number, today = new Date()): Date {
  const y = today.getFullYear();
  const cand = new Date(y, month - 1, 15);
  return cand < today ? new Date(y + 1, month - 1, 15) : cand;
}
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
