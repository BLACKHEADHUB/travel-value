'use client';
import { useState } from 'react';
import type { DestinationView, MonthView } from '@/lib/data';
import { freeTripCost, packageStats, verdict } from '@/lib/compare';
import { NA, won, wonRange } from '@/lib/format';

const yn = (v: boolean | null, yes: string, no: string) => (v === null ? NA : v ? yes : no);

export function PackageCompare({
  d,
  m,
  defaultNights,
}: {
  d: DestinationView;
  m: MonthView;
  defaultNights: number;
}) {
  const [nights, setNights] = useState(defaultNights);
  const nightOptions = [...new Set([3, 4, ...d.packages.map((p) => p.nights)])].sort(
    (a, b) => a - b,
  );
  const free = freeTripCost({
    flightMin: m.flight.min,
    flightMax: m.flight.max,
    dailyCost: m.dailyCost.total,
    nights,
  });
  const stats = packageStats(d.packages, m.month, nights);
  const v = verdict(free, stats);
  const inMonth = d.packages.filter((p) => p.departureMonth === m.month);
  const others = d.packages.filter((p) => p.departureMonth !== m.month);

  return (
    <section aria-labelledby="pkg-h" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pkg-h" className="text-lg font-bold">
          자유여행 vs 패키지
        </h2>
        <div role="radiogroup" aria-label="일정" className="flex gap-1">
          {nightOptions.map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={nights === n}
              onClick={() => setNights(n)}
              className={`rounded-full border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-sky-600 ${
                nights === n ? 'border-sky-700 bg-sky-700 text-white' : 'border-zinc-300'
              }`}
            >
              {n}박 {n + 1}일
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-600">자유여행 추정 총비용 (성인 1인)</p>
          <p className="mt-1 text-xl font-bold">{free ? wonRange(free.min, free.max) : NA}</p>
          <p className="mt-1 text-xs text-zinc-600">
            항공{m.flight.typical ? '(연중 대표가)' : ''} + 1일 경비 {won(m.dailyCost.total)} ×{' '}
            {nights}박
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4">
          <p className="text-xs text-zinc-600">패키지 대표 가격대 (최저~중앙값)</p>
          <p className="mt-1 text-xl font-bold">
            {stats.min !== null ? wonRange(stats.min, stats.median) : NA}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {m.month}월 출발 {nights}박 · 비교 가능 {stats.count}개
            {stats.excludedNightsMismatch
              ? ` · 박수 달라 제외 ${stats.excludedNightsMismatch}개`
              : ''}
            {stats.excludedUnclear ? ` · 조건 불명확 제외 ${stats.excludedUnclear}개` : ''}
          </p>
        </div>
      </div>
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
        {v.text}
      </p>
      <p className="text-xs text-zinc-600">
        패키지 가격은 출발일 기준이며 변동이 커요. 참고용이니 실제 가격·조건은 판매처에서
        확인하세요.
      </p>

      {[
        { title: `${m.month}월 출발 상품`, items: inMonth },
        { title: '다른 달 출발 상품 (참고)', items: others },
      ]
        .filter((g) => g.items.length)
        .map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 text-sm font-semibold">{g.title}</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.items.map((p) => (
                <li
                  key={p.url + p.priceKRW}
                  className="space-y-2 rounded-xl border border-zinc-200 p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-zinc-600">{p.vendor}</p>
                      <p className="font-semibold">{p.title}</p>
                    </div>
                    {!p.termsClear && (
                      <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-700">
                        조건 불명확
                      </span>
                    )}
                  </div>
                  <p>
                    <span
                      className={
                        p.termsClear ? 'text-lg font-bold' : 'text-sm font-semibold text-zinc-700'
                      }
                    >
                      {won(p.priceKRW)}
                    </span>
                    {!p.termsClear && (
                      <span className="ml-1 text-xs text-zinc-600">
                        (포함 조건 미확인 — 가격만 참고)
                      </span>
                    )}
                    <span className="ml-1 text-xs text-zinc-600">
                      {p.nights}박 · {p.departureDate ?? `${p.departureMonth}월`} 출발 기준 · 기준일{' '}
                      {p.asOf}
                    </span>
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                    <dt className="text-zinc-600">포함</dt>
                    <dd>{p.included.length ? p.included.join(', ') : NA}</dd>
                    <dt className="text-zinc-600">불포함</dt>
                    <dd>
                      {p.excluded.length ? p.excluded.join(', ') : NA}
                      {p.extraKnownKRW ? ` (확인된 추가 ${won(p.extraKnownKRW)})` : ''}
                    </dd>
                    <dt className="text-zinc-600">유류할증료</dt>
                    <dd>{yn(p.priceIncludesFuelSurcharge, '포함', '불포함')}</dd>
                    <dt className="text-zinc-600">쇼핑 / 선택관광</dt>
                    <dd>
                      {yn(p.hasShopping, '쇼핑 있음', '노쇼핑')} /{' '}
                      {yn(p.hasOptionalTours, '선택관광 있음', '없음')}
                    </dd>
                  </dl>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-sky-800 underline underline-offset-2"
                  >
                    판매처에서 보기<span className="sr-only"> (새 창)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      {!d.packages.length && <p className="text-sm text-zinc-600">수집된 패키지 상품이 없어요.</p>}

      <div className="rounded-xl bg-zinc-50 p-4 text-sm">
        <h3 className="mb-2 font-semibold">어떤 방식이 맞을까?</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <p className="font-medium">패키지가 잘 맞는 사람</p>
            <p className="text-zinc-700">
              일정 짜기가 부담되거나, 현지 언어·이동이 걱정되거나, 단체 일정·가이드 설명을 선호하는
              경우. 쇼핑·선택관광 여부와 가이드 경비를 꼭 확인하세요.
            </p>
          </li>
          <li>
            <p className="font-medium">자유여행이 잘 맞는 사람</p>
            <p className="text-zinc-700">
              원하는 곳에 오래 머물고 싶고, 대중교통·예약을 스스로 처리할 수 있으며, 특가
              항공·숙소를 직접 찾는 걸 즐기는 경우.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
