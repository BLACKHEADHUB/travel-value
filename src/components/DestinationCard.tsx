import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { NA, SEASON_LABEL, temp, won } from '@/lib/format';
import { isRainy, visaLabel } from '@/lib/view';
import { freeTripCost, packageStats, verdict } from '@/lib/compare';
import { nightsLabel, type Prefs } from '@/lib/prefs';
import type { DestinationScore } from '@/lib/score';
import { CardActions } from './CardActions';
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
  const v = verdict(
    freeTripCost({
      flightMin: m.flight.min,
      flightMax: m.flight.max,
      dailyCost: m.dailyCost.total,
      nights,
    }),
    packageStats(d.packages, month, nights),
  );
  const hours = d.flightHours.ICN;
  const unpriced = score.total !== null && score.parts.price === null;

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-accent">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-200 to-emerald-100">
        {d.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 export, 외부 Commons 이미지
          <img
            src={d.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        {m.seasonLevel && (
          <span className="absolute top-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {SEASON_LABEL[m.seasonLevel]}
          </span>
        )}
        <div className="absolute top-3 right-3">
          <CardActions id={d.id} name={d.nameKo} only="fav" />
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
          <h2 className="min-w-0">
            <Link
              href={`/d/${d.id}/?${query}`}
              className="text-xl font-bold drop-shadow after:absolute after:inset-0 focus:outline-none"
            >
              {d.nameKo}
            </Link>
            <span className="ml-1.5 text-sm text-white/80">{d.country}</span>
          </h2>
          <p className="shrink-0 text-right leading-none">
            <span className="sr-only">가성비 점수 </span>
            <span className="text-3xl font-extrabold tabular-nums">{score.total ?? '–'}</span>
            <span className="text-sm text-white/80">점</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm text-sub">
            {nightsLabel(nights)} 예상{' '}
            <b className="text-lg font-bold text-ink tabular-nums">{won(score.totalCost)}</b>
          </p>
          {unpriced && (
            <span
              className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-sub"
              title="1일 경비 정보가 없어 가격 항목을 빼고 점수를 매겼어요"
            >
              가격 제외
            </span>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-sub">
          <li>
            <span className="sr-only">기온 </span>
            {temp(m.avgTempMin, m.avgTempMax)}
          </li>
          <li className={isRainy(m) ? 'font-medium text-sky-700 dark:text-sky-300' : ''}>
            비 {m.rainfallMm === null ? NA : `${m.rainfallMm}mm`}
          </li>
          <li>비행 {hours === null ? NA : `${hours}시간`}</li>
          <li className={visa.caution ? 'text-amber-700 dark:text-amber-300' : ''}>{visa.text}</li>
        </ul>
        <ScoreBreakdown score={score} />
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          {v.kind === 'package' || v.kind === 'free' ? (
            <p className="min-w-0 truncate text-xs text-note-ink" title={v.text}>
              {v.text}
            </p>
          ) : (
            <span className="min-w-0 truncate text-xs text-sub">{d.themes.join(' · ')}</span>
          )}
          <CardActions id={d.id} name={d.nameKo} only="compare" />
        </div>
        {d.imageCredit && (
          <p
            className="truncate text-[11px] text-sub/80"
            title={`사진: ${d.imageCredit.author} / ${d.imageCredit.license} (Wikimedia Commons)`}
          >
            사진 © {d.imageCredit.author} · {d.imageCredit.license}
          </p>
        )}
      </div>
    </article>
  );
}
