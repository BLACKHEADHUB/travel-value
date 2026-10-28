'use client';
import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DestinationView } from '@/lib/data';
import { THEMES } from '@/lib/themes';
import { meanTemp, parseMonth } from '@/lib/view';
import { MonthPicker } from './MonthPicker';
import { DestinationCard } from './DestinationCard';
import { PriceNotice } from './Notice';

type Sort = 'score' | 'flight' | 'comfort';
const SORT_LABEL: Record<Sort, string> = {
  score: '가성비 점수순',
  flight: '항공값 낮은 순',
  comfort: '기온 쾌적도순',
};
const BUDGETS = [50, 100, 150, 200, 300];
const TEMP_FILTER = {
  any: '전체',
  cool: '선선 (평균 18℃ 미만)',
  mild: '쾌적 (18~27℃)',
  hot: '더움 (27℃ 초과)',
} as const;
type TempKey = keyof typeof TEMP_FILTER;

const last = (a: number | null, b: number) => (a === null ? b : a);

export function Explorer({ destinations }: { destinations: DestinationView[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const month = parseMonth(sp.get('m'));
  const themeParam = sp.get('theme') ?? '';
  const themes = useMemo(() => themeParam.split(',').filter(Boolean), [themeParam]);
  const budget = Number(sp.get('budget')) || null; // 만 원
  const includeUnknownCost = sp.get('unknown') === '1';
  const maxHours = Number(sp.get('hours')) || null;
  const visaFree = sp.get('visa') === 'free';
  const tempKey = (sp.get('temp') ?? 'any') as TempKey;
  const sort = (sp.get('sort') ?? 'score') as Sort;

  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    router.replace(`${pathname}?${p}`, { scroll: false });
  };

  const { list, unknownCostHidden } = useMemo(() => {
    let unknownCostHidden = 0;
    const out = destinations.filter((d) => {
      const m = d.months[month - 1];
      if (themes.length && !themes.some((t) => (d.themes as string[]).includes(t))) return false;
      if (visaFree && d.visaInfo.kind !== 'free') return false;
      const h = d.flightHours.ICN;
      if (maxHours && (h === null || h > maxHours)) return false;
      const t = meanTemp(m);
      if (tempKey !== 'any') {
        if (t === null) return false;
        if (tempKey === 'cool' && t >= 18) return false;
        if (tempKey === 'mild' && (t < 18 || t > 27)) return false;
        if (tempKey === 'hot' && t <= 27) return false;
      }
      if (budget) {
        if (m.totalCost === null) {
          if (!includeUnknownCost) unknownCostHidden++;
          return includeUnknownCost;
        }
        if (m.totalCost > budget * 10000) return false;
      }
      return true;
    });
    const key = (d: DestinationView) => {
      const m = d.months[month - 1];
      if (sort === 'flight') return last(m.flight.min, Infinity);
      if (sort === 'comfort') return -last(m.score.parts.climate, -Infinity);
      return -last(m.score.total, -Infinity);
    };
    return { list: out.sort((a, b) => key(a) - key(b)), unknownCostHidden };
  }, [destinations, month, themes, budget, includeUnknownCost, maxHours, visaFree, tempKey, sort]);

  const unpricedShown = list.filter((d) => d.months[month - 1].score.parts.price === null).length;

  const toggleTheme = (t: string) =>
    set({
      theme:
        (themes.includes(t) ? themes.filter((x) => x !== t) : [...themes, t]).join(',') || null,
    });

  const select =
    'rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-sky-600';

  return (
    <div className="space-y-5">
      <section aria-label="월 선택" className="space-y-2">
        <MonthPicker value={month} onChange={(m) => set({ m: String(m) })} />
      </section>

      <section
        aria-label="필터와 정렬"
        className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
      >
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-zinc-700">테마</legend>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => {
              const on = themes.includes(t);
              return (
                <button
                  key={t}
                  aria-pressed={on}
                  onClick={() => toggleTheme(t)}
                  className={`rounded-full border px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-sky-600 ${
                    on
                      ? 'border-sky-700 bg-sky-700 text-white'
                      : 'border-zinc-300 bg-white text-zinc-800'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            기온
            <select
              className={select}
              value={tempKey}
              onChange={(e) => set({ temp: e.target.value === 'any' ? null : e.target.value })}
            >
              {(Object.keys(TEMP_FILTER) as TempKey[]).map((k) => (
                <option key={k} value={k}>
                  {TEMP_FILTER[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            예산 상한 (항공+경비)
            <select
              className={select}
              value={budget ?? ''}
              onChange={(e) => set({ budget: e.target.value || null })}
            >
              <option value="">제한 없음</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}만 원 이하
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            비행시간 (인천 출발)
            <select
              className={select}
              value={maxHours ?? ''}
              onChange={(e) => set({ hours: e.target.value || null })}
            >
              <option value="">제한 없음</option>
              {[3, 5, 8, 12].map((h) => (
                <option key={h} value={h}>
                  {h}시간 이내
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-700">
            정렬
            <select
              className={select}
              value={sort}
              onChange={(e) => set({ sort: e.target.value === 'score' ? null : e.target.value })}
            >
              {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 self-end py-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={visaFree}
              onChange={(e) => set({ visa: e.target.checked ? 'free' : null })}
            />
            무비자만
          </label>
        </div>
        {budget !== null && (
          <label className="flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={includeUnknownCost}
              onChange={(e) => set({ unknown: e.target.checked ? '1' : null })}
            />
            경비 정보가 없는 곳도 보기
            {unknownCostHidden > 0 && ` (지금 ${unknownCostHidden}곳 숨김)`}
          </label>
        )}
        <p className="text-xs text-zinc-600">
          예산은 왕복 항공(해당 월 또는 연중 대표가 중간값) + 1일 경비 × 4박 기준이에요. 항공값은
          인천 출발 기준이에요.
        </p>
      </section>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-base font-semibold" aria-live="polite">
          {month}월 추천 {list.length}곳
        </h2>
        <PriceNotice />
      </div>
      {sort === 'score' && unpricedShown > 0 && (
        <p className="-mt-3 text-xs text-zinc-600">
          &lsquo;가격 제외&rsquo; 표시가 있는 {unpricedShown}곳은 경비 정보가 없어 가격 항목을 빼고
          점수를 매겼어요. 가격이 반영된 곳과 점수를 그대로 비교하기는 어려워요.
        </p>
      )}

      {list.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <li key={d.id}>
              <DestinationCard d={d} month={month} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600">
          조건에 맞는 여행지가 없어요. 필터를 조금 풀어 보세요.
        </p>
      )}
    </div>
  );
}
