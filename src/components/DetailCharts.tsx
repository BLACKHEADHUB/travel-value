'use client';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthView } from '@/lib/data';
import { SEASON_LABEL } from '@/lib/format';

const SEASON_FILL = { peak: '#fecaca', shoulder: '#fef3c7', off: '#dcfce7' } as const;

export function DetailCharts({ months, selected }: { months: MonthView[]; selected: number }) {
  const rows = months.map((m) => ({
    name: `${m.month}월`,
    month: m.month,
    min: m.avgTempMin,
    max: m.avgTempMax,
    rain: m.rainfallMm,
    flightMin: m.flightPrice.min === null ? null : Math.round(m.flightPrice.min / 10000),
    flightMax: m.flightPrice.max === null ? null : Math.round(m.flightPrice.max / 10000),
    season: m.seasonLevel,
  }));
  const seasonAreas = rows.filter((r) => r.season);
  const hasFlight = rows.some((r) => r.flightMin !== null);
  // 출처가 월 평균/중간값 하나만 줄 때(min=max)는 선을 하나로
  const singleValue = rows.every((r) => r.flightMin === r.flightMax);
  return (
    <div className="space-y-6">
      <figure>
        <figcaption className="mb-2 text-sm font-semibold">기온(℃)과 강수량(mm)</figcaption>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e4e4e7" vertical={false} />
              {seasonAreas.map((r) => (
                <ReferenceArea
                  key={r.month}
                  yAxisId="t"
                  x1={r.name}
                  x2={r.name}
                  fill={SEASON_FILL[r.season!]}
                  fillOpacity={0.6}
                />
              ))}
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="t" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="r" dataKey="rain" name="강수량" fill="#7dd3fc" />
              <Line
                yAxisId="t"
                dataKey="max"
                name="최고기온"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="t"
                dataKey="min"
                name="최저기온"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {seasonAreas.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-600">
            {(Object.keys(SEASON_FILL) as (keyof typeof SEASON_FILL)[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span
                  className="size-3 rounded-sm"
                  style={{ background: SEASON_FILL[k] }}
                  aria-hidden
                />
                {SEASON_LABEL[k]}
              </span>
            ))}
          </p>
        )}
      </figure>
      <figure>
        <figcaption className="mb-2 text-sm font-semibold">월별 왕복 항공값 (만 원)</figcaption>
        {hasFlight ? (
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceArea x1={`${selected}월`} x2={`${selected}월`} fill="#e0f2fe" />
                <Line
                  dataKey="flightMin"
                  name={singleValue ? '월 평균/중간값' : '최저'}
                  stroke="#0369a1"
                  strokeWidth={2}
                  connectNulls={false}
                />
                {!singleValue && (
                  <Line
                    dataKey="flightMax"
                    name="최고"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">월별 항공값 정보 없음</p>
        )}
      </figure>
    </div>
  );
}
