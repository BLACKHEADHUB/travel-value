'use client';
import type { DestinationView } from '@/lib/data';
import { CONFIDENCE_LABEL, NA, SEASON_LABEL, temp, won, wonRange } from '@/lib/format';
import { flightSearchUrl, staySearchUrl } from '@/lib/links';
import { isRainy, recommendedTrip, visaLabel } from '@/lib/view';
import { SCORE_WEIGHTS, scorePoints, seasonScores, travelBurden } from '@/lib/score';
import { nightsLabel } from '@/lib/prefs';
import type { PeerStats } from '@/lib/trip';
import { useTrip } from '@/lib/useTrip';
import { TripControls } from './TripControls';
import { ScoreBreakdown } from './ScoreBreakdown';
import { SeasonCalendar } from './SeasonCalendar';
import { DetailCharts } from './DetailCharts';
import { PackageCompare } from './PackageCompare';
import { PriceNotice } from './Notice';

const PART_LABEL = {
  price: '가격',
  climate: '날씨',
  theme: '볼거리',
  access: '이동·입국',
} as const;

export function DetailBody({ d, peers }: { d: DestinationView; peers: PeerStats }) {
  const { prefs, scores, setPrefs } = useTrip([d], peers);
  const { month, nights } = prefs;
  const m = d.months[month - 1];
  const score = scores.get(d.id)!;
  const season = seasonScores(d, prefs, peers);
  const visa = visaLabel(d, month);
  const rainyMonths = d.months.filter(isRainy).map((x) => `${x.month}월`);
  const cautions = [
    ...d.months.filter((x) => x.notes).map((x) => `${x.month}월: ${x.notes}`),
    ...(rainyMonths.length ? [`강수량 많은 달: ${rainyMonths.join(', ')}`] : []),
  ];
  const reason = {
    price:
      score.totalCost === null
        ? '항공 또는 1일 경비 정보가 없어요'
        : `총액 ${won(score.totalCost)} — ${score.priceBasis === 'region' ? '같은 지역' : '전체'} 평균과 비교`,
    climate:
      m.avgTempMin === null
        ? '기후 정보 없음'
        : `일평균 ${Math.round(((m.avgTempMin + (m.avgTempMax ?? m.avgTempMin)) / 2) * 10) / 10}℃ (선호 ${prefs.tMin}~${prefs.tMax}℃), 강수 ${m.rainfallMm ?? '?'}mm${prefs.rainAvoid ? ', 비 피하기' : ''}`,
    theme: `테마 ${d.themes.length}개 (${d.themes.join(', ')})`,
    access:
      d.flightHours.ICN === null
        ? `입국: ${visa.text}`
        : `왕복 비행 ${d.flightHours.ICN * 2}시간 = 여행 시간의 ${Math.round(travelBurden(d.flightHours.ICN, nights) * 100)}%, 입국: ${visa.text}`,
  } as const;
  const linkCls =
    'inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const card = 'rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line sm:p-7';

  return (
    <div className="space-y-6">
      <div className={card}>
        <TripControls prefs={prefs} onChange={setPrefs} />
      </div>

      <div className={card}>
        <SeasonCalendar
          name={d.nameKo}
          scores={season}
          prefs={prefs}
          onPick={(month) => setPrefs({ month, date: null })}
        />
      </div>

      <section aria-labelledby="sum-h" className={`${card} grid gap-6 md:grid-cols-[1fr_1.3fr]`}>
        <h2 id="sum-h" className="sr-only">
          {month}월 요약
        </h2>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <p className="leading-none">
              <span className="text-6xl font-extrabold tracking-tight tabular-nums">
                {score.total ?? '–'}
              </span>
              <span className="text-lg text-sub">점</span>
            </p>
            <p className="pb-1 text-sm text-sub">
              {nightsLabel(nights)} 예상
              <br />
              <b className="text-2xl font-bold text-ink tabular-nums">{won(score.totalCost)}</b>
            </p>
          </div>
          <ScoreBreakdown score={score} showLink />
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              className={`${linkCls} bg-accent text-white hover:opacity-90`}
              target="_blank"
              rel="noopener noreferrer"
              href={flightSearchUrl({
                origin: 'ICN',
                cityKo: d.nameKo,
                month,
                nights,
                date: prefs.date,
              })}
            >
              항공권 검색<span className="sr-only"> (새 창, Google 항공편)</span>
            </a>
            <a
              className={`${linkCls} bg-muted hover:bg-line`}
              target="_blank"
              rel="noopener noreferrer"
              href={staySearchUrl({ cityKo: d.nameKo, month, nights, date: prefs.date })}
            >
              숙소 검색<span className="sr-only"> (새 창, Booking.com)</span>
            </a>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          {[
            ['기온', temp(m.avgTempMin, m.avgTempMax)],
            [
              '강수',
              m.rainfallMm === null ? NA : `${m.rainfallMm}mm${isRainy(m) ? ' · 비 많음' : ''}`,
            ],
            [
              `왕복 항공${m.flight.typical ? ' (연중 대표가)' : ''}`,
              wonRange(m.flight.min, m.flight.max),
            ],
            ['현지 1일 경비', won(m.dailyCost.total)],
            ['시즌', m.seasonLevel ? SEASON_LABEL[m.seasonLevel] : NA],
            ['추천 일정', recommendedTrip(d)],
            ['비행', d.flightHours.ICN === null ? NA : `약 ${d.flightHours.ICN}시간`],
            ['입국', `${visa.text}${d.visaInfo.source ? '' : ' · 출처 미확인'}`],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-line pb-3">
              <dt className="text-xs text-sub">{k}</dt>
              <dd className="mt-0.5 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="md:col-span-2">
          <PriceNotice asOf={m.flight.asOf ?? m.dailyCost.asOf} />
        </div>
      </section>

      <section aria-labelledby="chart-h" className={card}>
        <h2 id="chart-h" className="mb-3 text-lg font-bold">
          12개월 한눈에
        </h2>
        <DetailCharts months={d.months} selected={month} />
        {d.climateSource && (
          <p className="mt-2 text-xs text-sub">
            기후: {d.climateSource}. 격자 평균값이라 해안·섬·고지대는 실제 관측과 몇 도 차이 날 수
            있어요.
          </p>
        )}
      </section>

      <PackageCompare d={d} m={m} nights={nights} onNights={(n) => setPrefs({ nights: n })} />

      <section aria-labelledby="lm-h" className={card}>
        <h2 id="lm-h" className="mb-2 text-lg font-bold">
          랜드마크
        </h2>
        <ul className="flex flex-wrap gap-2">
          {d.landmarks.map((l) => (
            <li key={l} className="rounded-lg bg-muted px-3 py-1.5 text-sm">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="warn-h" className={card}>
        <h2 id="warn-h" className="mb-2 text-lg font-bold">
          주의사항
        </h2>
        {cautions.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-sub">{NA}</p>
        )}
        {d.visaInfo.note && <p className="mt-2 text-sm">비자: {d.visaInfo.note}</p>}
      </section>

      <section aria-labelledby="score-h" className={`${card} space-y-3`}>
        <h2 id="score-h" className="text-lg font-bold">
          가성비 점수 산출 근거 ({month}월 · {nightsLabel(nights)})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-sub">
              <th className="py-1.5 font-medium">항목</th>
              <th className="py-1.5 font-medium">근거</th>
              <th className="py-1.5 font-medium">항목 점수</th>
              <th className="py-1.5 font-medium">반영 점수</th>
            </tr>
          </thead>
          <tbody>
            {scorePoints(score).map((p) => (
              <tr key={p.key} className="border-b border-line align-top">
                <td className="py-1.5">{PART_LABEL[p.key]}</td>
                <td className="py-1.5 text-xs text-sub">{reason[p.key]}</td>
                <td className="py-1.5">
                  {score.parts[p.key] === null
                    ? '정보 없음'
                    : `${Math.round(score.parts[p.key]!)}/100`}
                </td>
                <td className="py-1.5 font-semibold">
                  {p.got === null ? '제외' : `${p.got}/${p.max}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-sub">
          기본 배점은 가격 {SCORE_WEIGHTS.price * 100} · 날씨 {SCORE_WEIGHTS.climate * 100} · 볼거리{' '}
          {SCORE_WEIGHTS.theme * 100} · 이동 {SCORE_WEIGHTS.access * 100}점이에요. 정보가 없는
          항목은 빼고 나머지 배점을 비례로 늘려요. 계산식은{' '}
          <a href="/score/" className="text-link underline">
            점수 기준
          </a>
          에 있어요.
        </p>
      </section>

      <section aria-labelledby="src-h" className="px-2 text-xs text-sub">
        <h2 id="src-h" className="mb-1 font-semibold text-ink">
          출처
        </h2>
        <ul className="space-y-0.5 break-all">
          {m.flight.source && (
            <li>
              항공({CONFIDENCE_LABEL[m.flight.confidence]}): {m.flight.source} · {m.flight.asOf}
            </li>
          )}
          {m.dailyCost.source && (
            <li>
              경비({CONFIDENCE_LABEL[m.dailyCost.confidence]}): {m.dailyCost.source} ·{' '}
              {m.dailyCost.asOf}
            </li>
          )}
          {d.visaInfo.source && <li>비자: {d.visaInfo.source}</li>}
          {d.seasonSource && <li>시즌: {d.seasonSource}</li>}
          {d.flightHoursSource && <li>비행시간: {d.flightHoursSource}</li>}
          {d.imageCredit && (
            <li>
              사진: {d.imageCredit.author} / {d.imageCredit.license} · {d.imageCredit.sourceUrl}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
