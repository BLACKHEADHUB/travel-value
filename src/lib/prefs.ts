// 사용자 여행 조건 (URL 쿼리). 서버·브라우저 공용.
import { DEFAULT_NIGHTS, MAX_NIGHTS, MIN_NIGHTS } from './trip';

export type Prefs = {
  month: number;
  nights: number;
  /** 출발일(YYYY-MM-DD). 있으면 month는 이 날짜의 달, 귀국일 = 출발일 + nights */
  date: string | null;
  /** 선호 일평균 기온 범위(℃) — 쾌적도 점수 기준 */
  tMin: number;
  tMax: number;
  /** 비 오는 달 피하기: 강수 감점 2배 */
  rainAvoid: boolean;
};

export const TEMP_BOUNDS = { min: -10, max: 35 } as const;
export const DEFAULT_TEMP = { tMin: 18, tMax: 27 } as const;

const int = (v: string | null | undefined) => {
  const n = Number(v);
  return v !== null && v !== undefined && v !== '' && Number.isInteger(n) ? n : null;
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 유효한 YYYY-MM-DD면 그대로, 아니면 null */
export function validDate(v: string | null): string | null {
  const m = v ? ISO.exec(v) : null;
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? v : null;
}

export function parsePrefs(sp: { get(k: string): string | null }, now = new Date()): Prefs {
  const date = validDate(sp.get('d'));
  const m = date ? Number(date.slice(5, 7)) : int(sp.get('m'));
  const n = int(sp.get('n'));
  const [a, b] = (sp.get('t') ?? '').split('~').map((x) => int(x));
  let tMin = a ?? DEFAULT_TEMP.tMin;
  let tMax = b ?? DEFAULT_TEMP.tMax;
  tMin = clamp(tMin, TEMP_BOUNDS.min, TEMP_BOUNDS.max);
  tMax = clamp(tMax, TEMP_BOUNDS.min, TEMP_BOUNDS.max);
  if (tMin > tMax) [tMin, tMax] = [tMax, tMin];
  return {
    month: m !== null && m >= 1 && m <= 12 ? m : now.getMonth() + 1,
    nights: n !== null ? clamp(n, MIN_NIGHTS, MAX_NIGHTS) : DEFAULT_NIGHTS,
    date,
    tMin,
    tMax,
    rainAvoid: sp.get('rain') === 'avoid',
  };
}

/** 다른 페이지로 넘길 때 쓰는 쿼리 (기본값은 생략) */
export function prefsQuery(p: Prefs): string {
  const q = new URLSearchParams({ m: String(p.month) });
  if (p.date) q.set('d', p.date);
  if (p.nights !== DEFAULT_NIGHTS) q.set('n', String(p.nights));
  if (p.tMin !== DEFAULT_TEMP.tMin || p.tMax !== DEFAULT_TEMP.tMax)
    q.set('t', `${p.tMin}~${p.tMax}`);
  if (p.rainAvoid) q.set('rain', 'avoid');
  return q.toString();
}

export const nightsLabel = (n: number) => `${n}박 ${n + 1}일`;

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** "11월 15일(토)" */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${m}월 ${d}일(${WEEK[dt.getDay()]})`;
}

/** 출발일 + 박수 → 귀국일 YYYY-MM-DD */
export function returnDate(iso: string, nights: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const r = new Date(y, m - 1, d + nights);
  return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`;
}

/** 조건 요약: "11월 15일(토) → 19일(수)" 또는 "11월 중" */
export function whenLabel(p: Prefs): string {
  if (!p.date) return `${p.month}월 중`;
  const back = returnDate(p.date, p.nights);
  const sameMonth = back.slice(0, 7) === p.date.slice(0, 7);
  const end = sameMonth ? dayLabel(back).replace(/^\d+월 /, '') : dayLabel(back);
  return `${dayLabel(p.date)} → ${end}`;
}
