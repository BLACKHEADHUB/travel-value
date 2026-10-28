'use client';
import { COMPARE_KEY, COMPARE_MAX, FAV_KEY, useStoredList } from '@/lib/storage';

/** 카드의 즐겨찾기(★)·비교 담기 버튼 (카드 전체 링크 위에 떠야 해서 z-10) */
export function CardActions({
  id,
  name,
  only,
}: {
  id: string;
  name: string;
  only?: 'fav' | 'compare';
}) {
  const fav = useStoredList(FAV_KEY);
  const cmp = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const isFav = fav.list.includes(id);
  const inCmp = cmp.list.includes(id);
  return (
    <div className="flex gap-1.5">
      {only !== 'compare' && (
        <button
          type="button"
          aria-pressed={isFav}
          aria-label={`${name} 즐겨찾기${isFav ? ' 해제' : ''}`}
          title={isFav ? '저장됨' : '저장'}
          onClick={() => fav.toggle(id)}
          className={`relative z-10 grid size-9 place-items-center rounded-full text-lg backdrop-blur-sm transition focus-visible:outline-2 focus-visible:outline-white ${
            isFav ? 'bg-amber-400 text-zinc-900' : 'bg-black/40 text-white hover:bg-black/60'
          }`}
        >
          <span aria-hidden>{isFav ? '★' : '☆'}</span>
        </button>
      )}
      {only !== 'fav' && (
        <button
          type="button"
          aria-pressed={inCmp}
          aria-label={`${name} 비교${inCmp ? '에서 빼기' : '에 담기'}`}
          disabled={!inCmp && cmp.full}
          title={!inCmp && cmp.full ? `비교는 최대 ${COMPARE_MAX}곳까지` : undefined}
          onClick={() => cmp.toggle(id)}
          className={`relative z-10 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 ${
            inCmp ? 'bg-accent text-white' : 'bg-muted text-ink hover:bg-line'
          }`}
        >
          {inCmp ? '✓ 비교 중' : '+ 비교'}
        </button>
      )}
    </div>
  );
}
