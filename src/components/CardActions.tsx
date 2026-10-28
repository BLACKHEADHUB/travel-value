'use client';
import { COMPARE_KEY, COMPARE_MAX, FAV_KEY, useStoredList } from '@/lib/storage';

const btn =
  'relative z-10 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-sky-600 disabled:opacity-50';

/** 카드의 즐겨찾기·비교 담기 버튼 (카드 전체 링크 위에 떠야 해서 z-10) */
export function CardActions({ id, name }: { id: string; name: string }) {
  const fav = useStoredList(FAV_KEY);
  const cmp = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const isFav = fav.list.includes(id);
  const inCmp = cmp.list.includes(id);
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        aria-pressed={isFav}
        aria-label={`${name} 즐겨찾기${isFav ? ' 해제' : ''}`}
        onClick={() => fav.toggle(id)}
        className={`${btn} ${isFav ? 'border-amber-500 bg-amber-400 text-zinc-900' : 'border-line-strong bg-surface'}`}
      >
        {isFav ? '★ 저장됨' : '☆ 저장'}
      </button>
      <button
        type="button"
        aria-pressed={inCmp}
        aria-label={`${name} 비교${inCmp ? '에서 빼기' : '에 담기'}`}
        disabled={!inCmp && cmp.full}
        title={!inCmp && cmp.full ? `비교는 최대 ${COMPARE_MAX}곳까지` : undefined}
        onClick={() => cmp.toggle(id)}
        className={`${btn} ${inCmp ? 'border-sky-700 bg-sky-700 text-white' : 'border-line-strong bg-surface'}`}
      >
        {inCmp ? '✓ 비교 중' : '+ 비교'}
      </button>
    </div>
  );
}
