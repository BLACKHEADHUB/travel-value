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

/** [11,12,1,2] → "11~2월", [3,5] → "3·5월", [4,5,6,10] → "4~6·10월" (연말-연초는 이어서 봄) */
export function monthsLabel(ms: number[]): string {
  if (!ms.length) return NA;
  const set = new Set(ms);
  // 연속 구간의 시작: 앞 달(12→1 순환)이 없는 달
  const starts = ms.filter((m) => !set.has(m === 1 ? 12 : m - 1));
  if (!starts.length) return '연중';
  const runs = starts.map((s) => {
    let e = s;
    while (set.has(e === 12 ? 1 : e + 1) && (e === 12 ? 1 : e + 1) !== s) e = e === 12 ? 1 : e + 1;
    return s === e ? `${s}` : `${s}~${e}`;
  });
  return `${runs.join('·')}월`;
}
