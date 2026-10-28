import Link from 'next/link';
import { CardActions } from './CardActions';
import type { DestinationView } from '@/lib/data';
import { NA, SEASON_LABEL, temp, won, wonRange } from '@/lib/format';
import { isRainy, visaLabel } from '@/lib/view';
import { freeTripCost, packageStats, verdict } from '@/lib/compare';
import { nightsLabel, type Prefs } from '@/lib/prefs';
import type { DestinationScore } from '@/lib/score';
import { ScoreBreakdown } from './ScoreBreakdown';

export function DestinationCard({
  d,
  prefs,
  score,
  query,
}: {
  d: DestinationView;
  prefs: Prefs;
  score: DestinationScore;
  /** 상세 링크에 넘길 여행 조건 쿼리 */
  query: string;
}) {
  const { month, nights } = prefs;
  const m = d.months[month - 1];
  const visa = visaLabel(d, month);
  const stats = packageStats(d.packages, month, nights);
  const v = verdict(
    freeTripCost({
      flightMin: m.flight.min,
      flightMax: m.flight.max,
      dailyCost: m.dailyCost.total,
      nights,
    }),
    stats,
  );
  const hours = d.flightHours.ICN;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition focus-within:ring-2 focus-within:ring-sky-600 hover:shadow-md">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-sky-200 to-emerald-100">
        {d.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 export, 외부 Commons 이미지
          <img
            src={d.imageUrl}
            alt={`${d.nameKo} 풍경`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-3xl font-bold text-sky-900/40"
            aria-hidden
          >
            {d.nameKo}
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-full bg-surface/95 px-3 py-1 text-sm font-bold text-ink shadow">
          <span className="sr-only">가성비 점수 </span>
          {score.total ?? '–'}
          <span className="text-xs font-normal text-sub">점</span>
          {score.total !== null && score.parts.price === null && (
            <span
              className="ml-1 text-xs font-normal text-sub"
              title="가격 정보가 없어 가격 항목을 빼고 계산"
            >
              가격 제외
            </span>
          )}
        </div>
        {m.seasonLevel && (
          <span className="absolute top-3 left-3 rounded-full bg-zinc-900/75 px-2.5 py-1 text-xs text-white">
            {SEASON_LABEL[m.seasonLevel]}
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">
              <Link
                href={`/d/${d.id}/?${query}`}
                className="after:absolute after:inset-0 focus:outline-none"
              >
                {d.nameKo}
              </Link>
              <span className="ml-1.5 text-sm font-normal text-sub">{d.country}</span>
            </h2>
            <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="테마">
              {d.themes.map((t) => (
                <li key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs text-sub">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <CardActions id={d.id} name={d.nameKo} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-sub">기온</dt>
            <dd className="font-medium">{temp(m.avgTempMin, m.avgTempMax)}</dd>
          </div>
          <div>
            <dt className="text-xs text-sub">강수</dt>
            <dd className="font-medium">
              {m.rainfallMm === null ? NA : `${m.rainfallMm}mm`}
              {isRainy(m) && (
                <span className="ml-1 rounded bg-info px-1 text-xs text-link">비 많음</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-sub">
              왕복 항공{m.flight.typical ? ' (연중 대표가)' : ''}
            </dt>
            <dd className="font-medium">{wonRange(m.flight.min, m.flight.max)}</dd>
          </div>
          <div>
            <dt className="text-xs text-sub">현지 1일 경비</dt>
            <dd className="font-medium">{won(m.dailyCost.total)}</dd>
          </div>
          <div>
            <dt className="text-xs text-sub">비행</dt>
            <dd className="font-medium">{hours === null ? NA : `약 ${hours}시간`}</dd>
          </div>
          <div>
            <dt className="text-xs text-sub">비자</dt>
            <dd className="font-medium">{visa.text}</dd>
          </div>
        </dl>
        <div className="space-y-0.5 rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-xs text-sub">
            {nightsLabel(nights)} 예상 총액{' '}
            <b className="text-sm text-ink">{won(score.totalCost)}</b>
          </p>
          <ScoreBreakdown score={score} />
        </div>
        <p className="text-xs text-sub">
          <span className="font-medium">랜드마크</span> · {d.landmarks.join(' · ')}
        </p>
        <p className="rounded-lg bg-note px-3 py-2 text-xs text-note-ink">
          <span className="font-semibold">{nightsLabel(nights)} 패키지 비교</span> · {v.text}
        </p>
        {d.imageCredit && (
          <p className="truncate text-xs text-sub">
            사진: {d.imageCredit.author} / {d.imageCredit.license} (Wikimedia Commons)
          </p>
        )}
      </div>
    </article>
  );
}
