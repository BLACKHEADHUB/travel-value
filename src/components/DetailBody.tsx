'use client';
import { useSearchParams } from 'next/navigation';
import type { DestinationView } from '@/lib/data';
import { CONFIDENCE_LABEL, NA, SEASON_LABEL, temp, won, wonRange } from '@/lib/format';
import { flightSearchUrl, staySearchUrl } from '@/lib/links';
import { fallbackNights, isRainy, parseMonth, recommendedTrip, visaLabel } from '@/lib/view';
import { pickNights } from '@/lib/compare';
import { SCORE_WEIGHTS } from '@/lib/score';
import { MonthPicker } from './MonthPicker';
import { DetailCharts } from './DetailCharts';
import { PackageCompare } from './PackageCompare';
import { PriceNotice } from './Notice';
import { useRouter } from 'next/navigation';

const PART_LABEL = {
  price: '가격(지역·전체 평균 대비)',
  climate: '기온·강수 쾌적도',
  theme: '테마·볼거리',
  access: '비행시간·비자',
} as const;

export function DetailBody({ d }: { d: DestinationView }) {
  const sp = useSearchParams();
  const router = useRouter();
  const month = parseMonth(sp.get('m'));
  const m = d.months[month - 1];
  const nights = pickNights(d.packages, fallbackNights(d));
  const visa = visaLabel(d, month);
  const rainyMonths = d.months.filter(isRainy).map((x) => `${x.month}월`);
  const cautions = [
    ...d.months.filter((x) => x.notes).map((x) => `${x.month}월: ${x.notes}`),
    ...(rainyMonths.length ? [`강수량 많은 달: ${rainyMonths.join(', ')}`] : []),
  ];
  const linkCls =
    'inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600';

  return (
    <div className="space-y-8">
      <MonthPicker value={month} onChange={(x) => router.replace(`?m=${x}`, { scroll: false })} />

      <section aria-labelledby="sum-h" className="grid gap-3 sm:grid-cols-4">
        <h2 id="sum-h" className="sr-only">
          {month}월 요약
        </h2>
        {[
          ['가성비 점수', m.score.total === null ? NA : `${m.score.total}점`],
          ['기온', temp(m.avgTempMin, m.avgTempMax)],
          [
            '강수',
            m.rainfallMm === null ? NA : `${m.rainfallMm}mm${isRainy(m) ? ' (비 많음)' : ''}`,
          ],
          ['시즌', m.seasonLevel ? SEASON_LABEL[m.seasonLevel] : NA],
          [
            `왕복 항공${m.flight.typical ? ' (연중 대표가)' : ''}`,
            wonRange(m.flight.min, m.flight.max),
          ],
          ['현지 1일 경비', won(m.dailyCost.total)],
          ['추천 일정', recommendedTrip(d)],
          ['비자', `${visa.text}${d.visaInfo.source ? '' : ' · 출처 미확인'}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-zinc-200 p-3">
            <p className="text-xs text-zinc-600">{k}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
      </section>
      <PriceNotice asOf={m.flight.asOf ?? m.dailyCost.asOf} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          className={`${linkCls} bg-sky-700 text-white`}
          target="_blank"
          rel="noopener noreferrer"
          href={flightSearchUrl({ origin: 'ICN', cityKo: d.nameKo, month, nights })}
        >
          {month}월 항공권 검색<span className="sr-only"> (새 창, Google 항공편)</span>
        </a>
        <a
          className={`${linkCls} border border-zinc-300`}
          target="_blank"
          rel="noopener noreferrer"
          href={staySearchUrl({ cityKo: d.nameKo, month, nights })}
        >
          {month}월 숙소 검색<span className="sr-only"> (새 창, Booking.com)</span>
        </a>
      </div>

      <section aria-labelledby="chart-h">
        <h2 id="chart-h" className="mb-3 text-lg font-bold">
          12개월 한눈에
        </h2>
        <DetailCharts months={d.months} selected={month} />
        {d.climateSource && (
          <p className="mt-2 text-xs text-zinc-600">
            기후: {d.climateSource}. 격자 평균값이라 해안·섬·고지대는 실제 관측과 몇 도 차이 날 수
            있어요.
          </p>
        )}
      </section>

      <PackageCompare d={d} m={m} defaultNights={nights} />

      <section aria-labelledby="lm-h">
        <h2 id="lm-h" className="mb-2 text-lg font-bold">
          랜드마크
        </h2>
        <ul className="flex flex-wrap gap-2">
          {d.landmarks.map((l) => (
            <li key={l} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="warn-h">
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
          <p className="text-sm text-zinc-600">{NA}</p>
        )}
        {d.visaInfo.note && <p className="mt-2 text-sm">비자: {d.visaInfo.note}</p>}
      </section>

      <section aria-labelledby="score-h">
        <h2 id="score-h" className="mb-2 text-lg font-bold">
          가성비 점수 산출 근거 ({month}월)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-zinc-600">
              <th className="py-1.5 font-medium">항목</th>
              <th className="py-1.5 font-medium">기본 가중치</th>
              <th className="py-1.5 font-medium">적용 가중치</th>
              <th className="py-1.5 font-medium">점수</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(PART_LABEL) as (keyof typeof PART_LABEL)[]).map((k) => (
              <tr key={k} className="border-b border-zinc-100">
                <td className="py-1.5">{PART_LABEL[k]}</td>
                <td>{Math.round(SCORE_WEIGHTS[k] * 100)}%</td>
                <td>{Math.round(m.score.weights[k] * 100)}%</td>
                <td>
                  {m.score.parts[k] === null ? '정보 없음(제외)' : Math.round(m.score.parts[k]!)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-zinc-600">
          정보가 없는 항목은 빼고 나머지 가중치를 비례 재분배해요. 가격은 항공 중간값 + 1일 경비 ×
          4박 기준
          {m.priceBasis === 'all'
            ? '이며, 같은 지역 비교 도시가 적어 전체 평균과 비교했어요.'
            : '이에요.'}
        </p>
      </section>

      <section aria-labelledby="src-h" className="text-xs text-zinc-600">
        <h2 id="src-h" className="mb-1 font-semibold text-zinc-800">
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
