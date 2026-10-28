import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { temp, won } from '@/lib/format';
import { nightsLabel, type Prefs } from '@/lib/prefs';
import type { DestinationScore } from '@/lib/score';

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
    <section aria-labelledby="top5-h" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="top5-h" className="text-xl font-bold tracking-tight">
          {prefs.month}월 · {nightsLabel(prefs.nights)} 가성비 TOP 5
        </h2>
        <p className="text-xs text-sub">가격 정보가 있는 곳만 순위에 넣었어요</p>
      </div>
      <ol className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
        {top.map((d, i) => {
          const m = d.months[prefs.month - 1];
          const s = scores.get(d.id)!;
          return (
            <li key={d.id} className="w-56 shrink-0 snap-start lg:w-auto">
              <Link
                href={`/d/${d.id}/?${query}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-sky-300 to-emerald-200 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {d.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- 정적 export, 외부 Commons 이미지
                  <img
                    src={d.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-white text-sm font-extrabold text-zinc-900">
                  {i + 1}
                </span>
                <div className="absolute inset-x-3 bottom-3 space-y-1 text-white">
                  <p className="flex items-baseline justify-between gap-2">
                    <span className="text-lg font-bold">{d.nameKo}</span>
                    <span>
                      <b className="text-2xl font-extrabold tabular-nums">{s.total}</b>
                      <span className="text-xs text-white/80">점</span>
                    </span>
                  </p>
                  <p className="text-xs text-white/85">
                    {temp(m.avgTempMin, m.avgTempMax)} · 총 {won(s.totalCost)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
