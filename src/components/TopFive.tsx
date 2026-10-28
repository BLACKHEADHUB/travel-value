import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { temp, won } from '@/lib/format';

/** 이달의 TOP 5 — 가격이 반영된(비교 가능한) 점수만으로 순위 */
export function TopFive({
  destinations,
  month,
}: {
  destinations: DestinationView[];
  month: number;
}) {
  const top = destinations
    .filter((d) => d.months[month - 1].score.parts.price !== null)
    .sort((a, b) => (b.months[month - 1].score.total ?? 0) - (a.months[month - 1].score.total ?? 0))
    .slice(0, 5);
  if (!top.length) return null;
  return (
    <section aria-labelledby="top5-h" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="top5-h" className="text-base font-bold">
          {month}월의 가성비 TOP 5
        </h2>
        <p className="text-xs text-sub">가격 정보가 있는 곳만 순위에 넣었어요</p>
      </div>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
        {top.map((d, i) => {
          const m = d.months[month - 1];
          return (
            <li key={d.id} className="min-w-40 shrink-0 sm:min-w-0">
              <Link
                href={`/d/${d.id}/?m=${month}`}
                className="block h-full rounded-xl border border-line bg-surface-2 p-3 hover:border-sky-600 focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                <p className="text-xs text-sub">{i + 1}위</p>
                <p className="font-bold">
                  {d.nameKo}{' '}
                  <span className="text-sm font-semibold text-link">{m.score.total}점</span>
                </p>
                <p className="mt-1 text-xs text-sub">
                  {temp(m.avgTempMin, m.avgTempMax)} · 4박 약 {won(m.totalCost)}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
