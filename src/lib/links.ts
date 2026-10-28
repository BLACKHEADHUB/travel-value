// 외부 검색 딥링크 (항공·숙소). 가격 데이터가 아니라 검색 바로가기.
import { addDays, nextDate, ymd } from './view';

export type Origin = 'ICN' | 'GMP';
export const ORIGIN_LABEL: Record<Origin, string> = { ICN: '인천(ICN)', GMP: '김포(GMP)' };

/** 출발일이 정해졌으면 그 날짜, 아니면 해당 월의 다음 15일 출발 */
export function tripDates(month: number, nights: number, date: string | null = null) {
  if (date) {
    const [y, m, d] = date.split('-').map(Number);
    const out = new Date(y, m - 1, d);
    return { checkin: date, checkout: ymd(addDays(out, nights)) };
  }
  const out = nextDate(month);
  return { checkin: ymd(out), checkout: ymd(addDays(out, nights)) };
}

export function flightSearchUrl(o: {
  origin: Origin;
  cityKo: string;
  month: number;
  nights: number;
  date?: string | null;
}) {
  const { checkin, checkout } = tripDates(o.month, o.nights, o.date);
  const q = `${o.origin}에서 ${o.cityKo} 왕복 항공편 ${checkin} 출발 ${checkout} 귀국`;
  return `https://www.google.com/travel/flights?hl=ko&curr=KRW&q=${encodeURIComponent(q)}`;
}

export function staySearchUrl(o: {
  cityKo: string;
  month: number;
  nights: number;
  date?: string | null;
}) {
  const { checkin, checkout } = tripDates(o.month, o.nights, o.date);
  const p = new URLSearchParams({
    ss: o.cityKo,
    checkin,
    checkout,
    group_adults: '1',
    no_rooms: '1',
    selected_currency: 'KRW',
  });
  return `https://www.booking.com/searchresults.ko.html?${p}`;
}
