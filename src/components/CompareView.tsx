'use client';
import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { freeTripCost, packageStats, verdict } from '@/lib/compare';
import { NA, SEASON_LABEL, temp, won, wonRange } from '@/lib/format';
import { COMPARE_KEY, COMPARE_MAX, useStoredList } from '@/lib/storage';
import { isRainy, visaLabel } from '@/lib/view';
import { nightsLabel } from '@/lib/prefs';
import type { PeerStats } from '@/lib/trip';
import { useTrip } from '@/lib/useTrip';
import { ScoreBreakdown } from './ScoreBreakdown';
import { TripControls } from './TripControls';
import { PriceNotice } from './Notice';

type Row = { label: string; cell: (d: DestinationView) => React.ReactNode };

export function CompareView({
  destinations,
  peers,
}: {
  destinations: DestinationView[];
  peers: PeerStats;
}) {
  const { prefs, scores, sp, setPrefs, query } = useTrip(destinations, peers);
  const { month, nights } = prefs;
  const stored = useStoredList(COMPARE_KEY, COMPARE_MAX);
  // ?ids= 로 공유된 링크가 있으면 그것을, 없으면 저장된 비교 목록을 쓴다
  const shared = sp.get('ids')?.split(',').filter(Boolean) ?? null;
  const ids = (shared ?? stored.list).slice(0, COMPARE_MAX);
  const picked = ids
    .map((id) => destinations.find((d) => d.id === id))
    .filter((d): d is DestinationView => !!d);

  const trip = (d: DestinationView) => {
    const m = d.months[month - 1];
    const free = freeTripCost({
      flightMin: m.flight.min,
      flightMax: m.flight.max,
      dailyCost: m.dailyCost.total,
      nights,
    });
    const stats = packageStats(d.packages, month, nights);
    return { nights, free, stats, v: verdict(free, stats) };
  };

  const rows: Row[] = [
    {
      label: '가성비 점수',
      cell: (d) => (
        <>
          <b>{scores.get(d.id)!.total ?? NA}</b>
          <ScoreBreakdown score={scores.get(d.id)!} compact />
        </>
      ),
    },
    {
      label: '기온',
      cell: (d) => temp(d.months[month - 1].avgTempMin, d.months[month - 1].avgTempMax),
    },
    {
      label: '강수',
      cell: (d) => {
        const m = d.months[month - 1];
        return m.rainfallMm === null ? NA : `${m.rainfallMm}mm${isRainy(m) ? ' (비 많음)' : ''}`;
      },
    },
    {
      label: '시즌',
      cell: (d) => {
        const s = d.months[month - 1].seasonLevel;
        return s ? SEASON_LABEL[s] : NA;
      },
    },
    {
      label: '왕복 항공',
      cell: (d) => {
        const f = d.months[month - 1].flight;
        return `${wonRange(f.min, f.max)}${f.typical ? ' (연중 대표가)' : ''}`;
      },
    },
    { label: '현지 1일 경비', cell: (d) => won(d.months[month - 1].dailyCost.total) },
    { label: `${nightsLabel(nights)} 총액`, cell: (d) => won(scores.get(d.id)!.totalCost) },
    {
      label: '비행시간',
      cell: (d) => (d.flightHours.ICN === null ? NA : `약 ${d.flightHours.ICN}시간`),
    },
    { label: '입국', cell: (d) => visaLabel(d, month).text },
    {
      label: '자유여행 추정',
      cell: (d) => {
        const t = trip(d);
        return t.free ? wonRange(t.free.min, t.free.max) : NA;
      },
    },
    {
      label: '패키지 대표가',
      cell: (d) => {
        const t = trip(d);
        return t.stats.min !== null
          ? `${wonRange(t.stats.min, t.stats.median)} (${t.stats.count}개)`
          : `${NA}${t.stats.excludedUnclear ? ` · 조건 불명확 ${t.stats.excludedUnclear}개 제외` : ''}`;
      },
    },
    { label: '자유 vs 패키지', cell: (d) => trip(d).v.text },
  ];

  return (
    <div className="space-y-5">
      <TripControls prefs={prefs} onChange={setPrefs} />
      {shared && (
        <p className="text-xs text-sub">
          공유된 비교 링크를 보고 있어요.{' '}
          <Link href={`/compare/?${query}`} className="text-link underline">
            내 비교 목록 보기
          </Link>
        </p>
      )}
      {picked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-sub">
          비교할 여행지가 없어요. 목록에서 카드의 <b>+ 비교</b>를 눌러 최대 {COMPARE_MAX}곳까지 담아
          보세요.{' '}
          <Link href={`/?${query}`} className="text-link underline">
            여행지 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[36rem] text-sm">
              <caption className="sr-only">{month}월 여행지 비교</caption>
              <thead className="bg-surface-2">
                <tr>
                  <th scope="col" className="w-32 p-3 text-left text-xs font-medium text-sub">
                    {month}월
                  </th>
                  {picked.map((d) => (
                    <th key={d.id} scope="col" className="p-3 text-left align-top">
                      <Link href={`/d/${d.id}/?${query}`} className="font-bold text-link underline">
                        {d.nameKo}
                      </Link>
                      <span className="ml-1 text-xs font-normal text-sub">{d.country}</span>
                      {!shared && (
                        <button
                          type="button"
                          onClick={() => stored.toggle(d.id)}
                          className="ml-2 text-xs text-sub underline focus-visible:outline-2 focus-visible:outline-accent"
                          aria-label={`${d.nameKo} 비교에서 빼기`}
                        >
                          빼기
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <th scope="row" className="p-3 text-left text-xs font-medium text-sub">
                      {r.label}
                    </th>
                    {picked.map((d) => (
                      <td key={d.id} className="p-3 align-top">
                        {r.cell(d)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-sub">
            <PriceNotice />
            <span>
              공유 링크:{' '}
              <Link
                href={`/compare/?${query}&ids=${picked.map((d) => d.id).join(',')}`}
                className="text-link underline"
              >
                이 비교 열기
              </Link>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
