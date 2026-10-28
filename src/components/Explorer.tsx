'use client';
import { useMemo } from 'react';
import type { DestinationView } from '@/lib/data';
import { THEMES } from '@/lib/themes';
import { meanTemp } from '@/lib/view';
import { nightsLabel } from '@/lib/prefs';
import { FAV_KEY, useStoredList } from '@/lib/storage';
import { useTrip } from '@/lib/useTrip';
import type { PeerStats } from '@/lib/trip';
import { DestinationCard } from './DestinationCard';
import { PriceNotice } from './Notice';
import { TopFive } from './TopFive';
import { TripControls } from './TripControls';

type Sort = 'score' | 'cost' | 'flight' | 'comfort';
const SORT_LABEL: Record<Sort, string> = {
  score: '가성비 점수순',
  cost: '총액 낮은 순',
  flight: '항공값 낮은 순',
  comfort: '날씨 점수순',
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
    'rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-sky-600';
  const check = 'flex items-center gap-2 py-2 text-sm text-ink';

  return (
    <div className="space-y-5">
      <TripControls prefs={prefs} onChange={setPrefs} />

      {!favOnly && (
        <TopFive destinations={destinations} prefs={prefs} scores={scores} query={query} />
      )}

      <section
        aria-label="필터와 정렬"
        className="space-y-3 rounded-2xl border border-line bg-surface-2 p-4"
      >
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold text-sub">테마</legend>
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
                      : 'border-line-strong bg-surface text-ink'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-sub">
            예산 상한 ({nightsLabel(prefs.nights)} 총액)
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
          <label className="flex flex-col gap-1 text-xs text-sub">
            비행시간 (인천 출발)
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
          <label className="flex flex-col gap-1 text-xs text-sub">
            정렬
            <select
              className={select}
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
        <div className="flex flex-wrap gap-x-5">
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={inTempOnly}
              onChange={(e) => setParams({ intemp: e.target.checked ? '1' : null })}
            />
            선호 기온 안에 드는 곳만
          </label>
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={visaFree}
              onChange={(e) => setParams({ visa: e.target.checked ? 'free' : null })}
            />
            무비자만
          </label>
          <label className={check}>
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={favOnly}
              onChange={(e) => setParams({ fav: e.target.checked ? '1' : null })}
            />
            즐겨찾기만 ({fav.list.length})
          </label>
          {budget !== null && (
            <label className={check}>
              <input
                type="checkbox"
                className="size-4 accent-sky-700"
                checked={includeUnknownCost}
                onChange={(e) => setParams({ unknown: e.target.checked ? '1' : null })}
              />
              경비 정보 없는 곳도 보기
              {unknownCostHidden > 0 && ` (${unknownCostHidden}곳 숨김)`}
            </label>
          )}
        </div>
        <p className="text-xs text-sub">
          총액 = 왕복 항공(해당 월, 없으면 연중 대표가의 중간값) + 1일 경비 × {prefs.nights}박.
          항공은 인천 출발 기준이에요.
        </p>
      </section>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-base font-semibold" aria-live="polite">
          {month}월 · {nightsLabel(prefs.nights)} 추천 {list.length}곳
        </h2>
        <PriceNotice />
      </div>
      {sort === 'score' && unpricedShown > 0 && (
        <p className="-mt-3 text-xs text-sub">
          &lsquo;가격 제외&rsquo; 표시가 있는 {unpricedShown}곳은 경비 정보가 없어 가격 항목을 빼고
          점수를 매겼어요. 가격이 반영된 곳과 점수를 그대로 비교하기는 어려워요.
        </p>
      )}

      {list.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <li key={d.id}>
              <DestinationCard d={d} prefs={prefs} score={scores.get(d.id)!} query={query} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-sub">
          {favOnly && !fav.list.length
            ? '아직 저장한 여행지가 없어요. 카드의 ☆ 저장을 눌러 보세요.'
            : '조건에 맞는 여행지가 없어요. 필터를 조금 풀어 보세요.'}
        </p>
      )}
    </div>
  );
}
