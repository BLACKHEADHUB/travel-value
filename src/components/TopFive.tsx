import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { temp, won } from '@/lib/format';
import { nightsLabel, type Prefs } from '@/lib/prefs';
import type { DestinationScore } from '@/lib/score';
import { ScoreBreakdown } from './ScoreBreakdown';

/** 이달의 TOP 5 — 가격이 반영된(비교 가능한) 점수만으로 순위 */
export function TopFive({
  destinations,
  prefs,
  scores,
  query,
}: {
  destinations: DestinationView[];
  prefs: Prefs;
  scores: Map<string, DestinationScore>;
  query: string;
}) {
  const top = destinations
    .filter((d) => scores.get(d.id)!.parts.price !== null)
    .sort((a, b) => (scores.get(b.id)!.total ?? 0) - (scores.get(a.id)!.total ?? 0))
    .slice(0, 5);
  if (!top.length) return null;
  return (
    <section aria-labelledby="top5-h" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="top5-h" className="text-lg font-bold">
          {prefs.month}월 · {nightsLabel(prefs.nights)} 가성비 TOP 5
        </h2>
        <p className="text-xs text-sub">가격 정보가 있는 곳만 순위에 넣었어요</p>
      </div>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
        {top.map((d, i) => {
          const m = d.months[prefs.month - 1];
          const s = scores.get(d.id)!;
          return (
            <li key={d.id} className="w-56 shrink-0 lg:w-auto">
              <Link
                href={`/d/${d.id}/?${query}`}
                className="block h-full space-y-1 rounded-xl border border-line bg-surface-2 p-3 hover:border-sky-600 focus-visible:outline-2 focus-visible:outline-sky-600"
              >
                <p className="text-xs text-sub">{i + 1}위</p>
                <p className="font-bold">
                  {d.nameKo} <span className="text-sm font-semibold text-link">{s.total}점</span>
                </p>
                <p className="text-xs text-sub">
                  {temp(m.avgTempMin, m.avgTempMax)} · 총 {won(s.totalCost)}
                </p>
                <ScoreBreakdown score={s} compact />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
