// 사용자 여행 조건 (URL 쿼리). 서버·브라우저 공용.
import { DEFAULT_NIGHTS, MAX_NIGHTS, MIN_NIGHTS } from './trip';

export type Prefs = {
  month: number;
  nights: number;
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

export function parsePrefs(sp: { get(k: string): string | null }, now = new Date()): Prefs {
  const m = int(sp.get('m'));
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
    tMin,
    tMax,
    rainAvoid: sp.get('rain') === 'avoid',
  };
}

/** 다른 페이지로 넘길 때 쓰는 쿼리 (기본값은 생략) */
export function prefsQuery(p: Prefs): string {
  const q = new URLSearchParams({ m: String(p.month) });
  if (p.nights !== DEFAULT_NIGHTS) q.set('n', String(p.nights));
  if (p.tMin !== DEFAULT_TEMP.tMin || p.tMax !== DEFAULT_TEMP.tMax)
    q.set('t', `${p.tMin}~${p.tMax}`);
  if (p.rainAvoid) q.set('rain', 'avoid');
  return q.toString();
}

export const nightsLabel = (n: number) => `${n}박 ${n + 1}일`;
