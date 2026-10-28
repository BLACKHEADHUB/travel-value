'use client';
import { useMemo, useState } from 'react';
import type { DestinationView } from '@/lib/data';
import { THEMES } from '@/lib/themes';
import { meanTemp } from '@/lib/view';
import { nightsLabel, whenLabel } from '@/lib/prefs';
import { FAV_KEY, useStoredList } from '@/lib/storage';
import { useTrip } from '@/lib/useTrip';
import type { PeerStats } from '@/lib/trip';
import { DestinationCard } from './DestinationCard';
import { TopFive } from './TopFive';
import { TripControls } from './TripControls';
import { BRAND } from './Logo';

type Sort = 'score' | 'cost' | 'flight' | 'comfort';
const SORT_LABEL: Record<Sort, string> = {
  score: '가성비순',
  cost: '총액 낮은 순',
  flight: '항공값 낮은 순',
  comfort: '날씨 좋은 순',
};
const BUDGETS = [50, 100, 150, 200, 300, 400, 500];

const last = (a: number | null, b: number) => (a === null ? b : a);

export function Explorer({
  destinations,
  peers,
}: {
  destinations: DestinationView[];
  peers: PeerStats;
}) {
  const { prefs, scores, sp, setParams, setPrefs, query } = useTrip(destinations, peers);
  const { month } = prefs;

  const themeParam = sp.get('theme') ?? '';
  const themes = useMemo(() => themeParam.split(',').filter(Boolean), [themeParam]);
  const budget = Number(sp.get('budget')) || null; // 만 원
  const includeUnknownCost = sp.get('unknown') === '1';
  const maxHours = Number(sp.get('hours')) || null;
  const visaFree = sp.get('visa') === 'free';
  const inTempOnly = sp.get('intemp') === '1';
  const sort = (sp.get('sort') ?? 'score') as Sort;
  const favOnly = sp.get('fav') === '1';
  const fav = useStoredList(FAV_KEY);

  const activeFilters =
    themes.length +
    [budget, maxHours, visaFree, inTempOnly, prefs.rainAvoid].filter(Boolean).length;
  // 패널 열림은 사용자가 정한다 (필터를 모두 꺼도 저절로 닫히지 않게). 처음엔 필터가 있으면 열어 둠
  const [filtersOpen, setFiltersOpen] = useState(activeFilters > 0);

  const { list, unknownCostHidden } = useMemo(() => {
    let unknownCostHidden = 0;
    const out = destinations.filter((d) => {
      const m = d.months[month - 1];
      const s = scores.get(d.id)!;
      if (favOnly && !fav.list.includes(d.id)) return false;
      if (themes.length && !themes.some((t) => (d.themes as string[]).includes(t))) return false;
      if (visaFree && d.visaInfo.kind !== 'free') return false;
      const h = d.flightHours.ICN;
      if (maxHours && (h === null || h > maxHours)) return false;
      if (inTempOnly) {
        const t = meanTemp(m);
        if (t === null || t < prefs.tMin || t > prefs.tMax) return false;
      }
      if (budget) {
        if (s.totalCost === null) {
          if (!includeUnknownCost) unknownCostHidden++;
          return includeUnknownCost;
        }
        if (s.totalCost > budget * 10000) return false;
      }
      return true;
    });
    const key = (d: DestinationView) => {
      const s = scores.get(d.id)!;
      if (sort === 'cost') return last(s.totalCost, Infinity);
      if (sort === 'flight') return last(d.months[month - 1].flight.min, Infinity);
      if (sort === 'comfort') return -last(s.parts.climate, -Infinity);
      return -last(s.total, -Infinity);
    };
    return { list: out.sort((a, b) => key(a) - key(b)), unknownCostHidden };
  }, [
    destinations,
    scores,
    month,
    prefs.tMin,
    prefs.tMax,
    themes,
    budget,
    includeUnknownCost,
    maxHours,
    visaFree,
    inTempOnly,
    sort,
    favOnly,
    fav.list,
  ]);

  const unpricedShown = list.filter((d) => scores.get(d.id)!.parts.price === null).length;

  const toggleTheme = (t: string) =>
    setParams({
      theme:
        (themes.includes(t) ? themes.filter((x) => x !== t) : [...themes, t]).join(',') || null,
    });

  const select =
    'w-full rounded-xl border-0 bg-muted px-3 py-2.5 text-sm ring-1 ring-line focus-visible:outline-2 focus-visible:outline-accent';
  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent ${
      on ? 'bg-ink text-surface' : 'bg-muted text-sub hover:text-ink'
    }`;
  const check = 'flex items-center gap-2 text-sm';

  return (
    <div className="space-y-10">
      <section className="space-y-6 rounded-[2rem] bg-gradient-to-br from-accent-soft via-surface to-surface p-5 ring-1 ring-line sm:p-10">
        <div>
          <p className="text-sm font-bold text-accent">{BRAND.name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl">
            {favOnly ? '저장한 여행지' : BRAND.tagline}
          </h1>
          <p className="mt-3 max-w-xl text-sub">{BRAND.description}</p>
        </div>
        <TripControls prefs={prefs} onChange={setPrefs} />
      </section>

      {!favOnly && (
        <TopFive destinations={destinations} prefs={prefs} scores={scores} query={query} />
      )}

      <section aria-labelledby="list-h" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="list-h" className="text-xl font-bold tracking-tight" aria-live="polite">
            {prefs.date ? whenLabel(prefs) : `${month}월`} · {nightsLabel(prefs.nights)} 전체{' '}
            {list.length}곳
          </h2>
          <div className="flex items-center gap-2">
            <label>
              <span className="sr-only">정렬</span>
              <select
                className="rounded-full border-0 bg-surface py-2 pr-8 pl-4 text-sm ring-1 ring-line focus-visible:outline-2 focus-visible:outline-accent"
                value={sort}
                onChange={(e) =>
                  setParams({ sort: e.target.value === 'score' ? null : e.target.value })
                }
              >
                {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <details
          className="group rounded-2xl bg-surface ring-1 ring-line open:shadow-sm"
          open={filtersOpen}
          onToggle={(e) => setFiltersOpen(e.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
            <span>
              필터
              {activeFilters > 0 && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                  {activeFilters}
                </span>
              )}
            </span>
            <span aria-hidden className="text-sub transition group-open:rotate-180">
              ⌄
            </span>
          </summary>
          <div className="space-y-4 border-t border-line px-4 py-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-sub">테마</legend>
              <div className="flex flex-wrap gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={themes.includes(t)}
                    onClick={() => toggleTheme(t)}
                    className={chip(themes.includes(t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold text-sub">
                <span className="block">예산 상한 ({nightsLabel(prefs.nights)} 총액)</span>
                <select
                  className={select}
                  value={budget ?? ''}
                  onChange={(e) => setParams({ budget: e.target.value || null })}
                >
                  <option value="">제한 없음</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>
                      {b}만 원 이하
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 text-xs font-semibold text-sub">
                <span className="block">비행시간 (인천 출발)</span>
                <select
                  className={select}
                  value={maxHours ?? ''}
                  onChange={(e) => setParams({ hours: e.target.value || null })}
                >
                  <option value="">제한 없음</option>
                  {[3, 5, 8, 12].map((h) => (
                    <option key={h} value={h}>
                      {h}시간 이내
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <label className={check}>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={prefs.rainAvoid}
                  onChange={(e) => setPrefs({ rainAvoid: e.target.checked })}
                />
                비 오는 달 피하기
              </label>
              <label className={check}>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={inTempOnly}
                  onChange={(e) => setParams({ intemp: e.target.checked ? '1' : null })}
                />
                선호 기온 안에 드는 곳만
              </label>
              <label className={check}>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={visaFree}
                  onChange={(e) => setParams({ visa: e.target.checked ? 'free' : null })}
                />
                무비자만
              </label>
              <label className={check}>
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={favOnly}
                  onChange={(e) => setParams({ fav: e.target.checked ? '1' : null })}
                />
                즐겨찾기만 ({fav.list.length})
              </label>
              {budget !== null && (
                <label className={check}>
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--accent)]"
                    checked={includeUnknownCost}
                    onChange={(e) => setParams({ unknown: e.target.checked ? '1' : null })}
                  />
                  경비 정보 없는 곳도 보기
                  {unknownCostHidden > 0 && ` (${unknownCostHidden}곳 숨김)`}
                </label>
              )}
            </div>
          </div>
        </details>

        <p className="text-xs text-sub">
          예상 총액 = 왕복 항공(인천 출발, 해당 월 또는 연중 대표가) + 1일 경비 × {prefs.nights}박.
          대략적인 참고 가격이에요.
          {sort === 'score' &&
            unpricedShown > 0 &&
            ` '가격 제외' ${unpricedShown}곳은 경비 정보가 없어 가격을 빼고 점수를 매겼어요.`}
        </p>

        {list.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <li key={d.id} className="min-w-0">
                <DestinationCard d={d} prefs={prefs} score={scores.get(d.id)!} query={query} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-surface p-10 text-center text-sm text-sub ring-1 ring-line">
            {favOnly && !fav.list.length
              ? '아직 저장한 여행지가 없어요. 카드의 ☆를 눌러 보세요.'
              : '조건에 맞는 여행지가 없어요. 필터를 조금 풀어 보세요.'}
          </p>
        )}
      </section>
    </div>
  );
}
