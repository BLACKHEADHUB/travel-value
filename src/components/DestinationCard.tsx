import Link from 'next/link';
import type { DestinationView } from '@/lib/data';
import { NA, SEASON_LABEL, temp, won, wonRange } from '@/lib/format';
import { isRainy } from '@/lib/view';
import { freeTripCost, packageStats, verdict } from '@/lib/compare';
import type { Origin } from '@/lib/links';

export function DestinationCard({
  d,
  month,
  origin,
}: {
  d: DestinationView;
  month: number;
  origin: Origin;
}) {
  const m = d.months[month - 1];
  const nights = 4;
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
  const hours = d.flightHours[origin];
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition focus-within:ring-2 focus-within:ring-sky-600 hover:shadow-md">
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
        <div className="absolute top-3 right-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-zinc-900 shadow">
          <span className="sr-only">가성비 점수 </span>
          {m.score.total ?? '–'}
          <span className="text-xs font-normal text-zinc-600">점</span>
        </div>
        {m.seasonLevel && (
          <span className="absolute top-3 left-3 rounded-full bg-zinc-900/75 px-2.5 py-1 text-xs text-white">
            {SEASON_LABEL[m.seasonLevel]}
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="text-lg font-bold">
            <Link
              href={`/d/${d.id}/?m=${month}`}
              className="after:absolute after:inset-0 focus:outline-none"
            >
              {d.nameKo}
            </Link>
            <span className="ml-1.5 text-sm font-normal text-zinc-600">{d.country}</span>
          </h2>
          <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="테마">
            {d.themes.map((t) => (
              <li key={t} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-zinc-600">기온</dt>
            <dd className="font-medium">{temp(m.avgTempMin, m.avgTempMax)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-600">강수</dt>
            <dd className="font-medium">
              {m.rainfallMm === null ? NA : `${m.rainfallMm}mm`}
              {isRainy(m) && (
                <span className="ml-1 rounded bg-sky-100 px-1 text-xs text-sky-800">비 많음</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-600">
              왕복 항공{m.flight.typical ? ' (연중 대표가)' : ''}
            </dt>
            <dd className="font-medium">{wonRange(m.flight.min, m.flight.max)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-600">현지 1일 경비</dt>
            <dd className="font-medium">{won(m.dailyCost.total)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-600">비행</dt>
            <dd className="font-medium">{hours === null ? NA : `약 ${hours}시간`}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-600">비자</dt>
            <dd className="font-medium">
              {d.visaInfo.required === null ? NA : d.visaInfo.required ? '필요/전자허가' : '무비자'}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-700">
          <span className="font-medium">랜드마크</span> · {d.landmarks.join(' · ')}
        </p>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-semibold">4박 기준 패키지 비교</span> · {v.text}
        </p>
      </div>
    </article>
  );
}
