export const NA = '정보 없음';

/** 1234567 → "123만 원", 12000 → "1.2만 원" */
export function won(n: number | null | undefined): string {
  if (n === null || n === undefined) return NA;
  const man = n / 10000;
  return `${man >= 10 ? Math.round(man).toLocaleString('ko-KR') : man.toFixed(1).replace(/\.0$/, '')}만 원`;
}

export function wonRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return NA;
  if (min === null || max === null || min === max) return won(min ?? max);
  return `${won(min).replace(' 원', '')}~${won(max)}`;
}

export function temp(min: number | null, max: number | null): string {
  if (min === null || max === null) return NA;
  return `${Math.round(min)}~${Math.round(max)}℃`;
}

export const SEASON_LABEL = { peak: '성수기', shoulder: '숄더 시즌', off: '비수기' } as const;
export const CONFIDENCE_LABEL = {
  high: '신뢰도 높음',
  medium: '신뢰도 보통',
  low: '신뢰도 낮음',
} as const;
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
