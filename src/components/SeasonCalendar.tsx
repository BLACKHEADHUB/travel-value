'use client';
import { monthsLabel } from '@/lib/format';
import { nightsLabel, type Prefs } from '@/lib/prefs';
import { bestMonths } from '@/lib/score';

/** 점수 → 칸 색 (진할수록 좋음) */
const tone = (s: number | null) =>
  s === null
    ? 'bg-muted text-sub'
    : s >= 85
      ? 'bg-accent text-white'
      : s >= 70
        ? 'bg-accent/65 text-white'
        : s >= 55
          ? 'bg-accent/30 text-ink'
          : 'bg-accent/10 text-sub';

/** 12개월 제철 달력: 같은 조건으로 달마다 점수를 매겨 언제가 제철인지 보여줌 */
export function SeasonCalendar({
  name,
  scores,
  prefs,
  onPick,
}: {
  name: string;
  scores: (number | null)[];
  prefs: Prefs;
  onPick: (month: number) => void;
}) {
  const best = bestMonths(scores);
  return (
    <section aria-labelledby="season-h" className="space-y-4">
      <div>
        <h2 id="season-h" className="text-lg font-bold">
          {name}의 제철은 <span className="text-accent">{monthsLabel(best)}</span>
        </h2>
        <p className="mt-1 text-xs text-sub">
          {nightsLabel(prefs.nights)} · 일평균 {prefs.tMin}~{prefs.tMax}℃ 기준으로 달마다 점수를
          매겼어요. 달을 누르면 그 달로 바뀌어요.
        </p>
      </div>
      <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {scores.map((s, i) => {
          const m = i + 1;
          const on = m === prefs.month;
          const isBest = best.includes(m);
          return (
            <li key={m}>
              <button
                type="button"
                onClick={() => onPick(m)}
                aria-pressed={on}
                aria-label={`${m}월 ${s ?? '정보 없음'}점${isBest ? ', 제철' : ''}`}
                className={`relative flex w-full flex-col items-center rounded-xl py-2.5 transition hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${tone(s)} ${
                  on ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                }`}
              >
                <span className="text-[11px] opacity-80">{m}월</span>
                <span className="text-base font-extrabold tabular-nums">{s ?? '–'}</span>
                {isBest && (
                  <span className="absolute -top-1.5 -right-1 rounded-full bg-amber-400 px-1 text-[9px] font-bold text-zinc-900">
                    제철
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
