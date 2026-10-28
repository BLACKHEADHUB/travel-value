'use client';
import { nightsLabel, TEMP_BOUNDS, type Prefs } from '@/lib/prefs';
import { MAX_NIGHTS, MIN_NIGHTS } from '@/lib/trip';
import { MonthPicker } from './MonthPicker';

const NIGHTS = Array.from({ length: MAX_NIGHTS - MIN_NIGHTS + 1 }, (_, i) => i + MIN_NIGHTS);

/** 여행 조건: 언제(월) · 며칠(박수) · 선호 기온 · 비 */
export function TripControls({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (p: Partial<Prefs>) => void;
}) {
  const field =
    'rounded-lg border border-line-strong bg-surface px-2.5 py-2 text-sm focus-visible:outline-2 focus-visible:outline-sky-600';
  return (
    <section aria-label="여행 조건" className="space-y-3">
      <MonthPicker value={prefs.month} onChange={(month) => onChange({ month })} />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className="flex flex-col gap-1 text-xs text-sub">
          여행 기간
          <select
            className={field}
            value={prefs.nights}
            onChange={(e) => onChange({ nights: Number(e.target.value) })}
          >
            {NIGHTS.map((n) => (
              <option key={n} value={n}>
                {nightsLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="min-w-64 flex-1 text-xs text-sub">
          <legend className="mb-1">
            선호 기온 (일평균){' '}
            <b className="text-ink">
              {prefs.tMin}℃ ~ {prefs.tMax}℃
            </b>
          </legend>
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-1">
              <span className="w-6">최저</span>
              <input
                type="range"
                className="flex-1 accent-sky-700"
                min={TEMP_BOUNDS.min}
                max={TEMP_BOUNDS.max}
                value={prefs.tMin}
                aria-valuetext={`${prefs.tMin}도`}
                onChange={(e) => onChange({ tMin: Math.min(Number(e.target.value), prefs.tMax) })}
              />
            </label>
            <label className="flex flex-1 items-center gap-1">
              <span className="w-6">최고</span>
              <input
                type="range"
                className="flex-1 accent-sky-700"
                min={TEMP_BOUNDS.min}
                max={TEMP_BOUNDS.max}
                value={prefs.tMax}
                aria-valuetext={`${prefs.tMax}도`}
                onChange={(e) => onChange({ tMax: Math.max(Number(e.target.value), prefs.tMin) })}
              />
            </label>
          </div>
        </fieldset>
        <label className="flex items-center gap-2 py-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4 accent-sky-700"
            checked={prefs.rainAvoid}
            onChange={(e) => onChange({ rainAvoid: e.target.checked })}
          />
          비 오는 달 피하기
        </label>
      </div>
    </section>
  );
}
