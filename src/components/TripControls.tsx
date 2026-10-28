'use client';
import { nightsLabel, TEMP_BOUNDS, type Prefs } from '@/lib/prefs';
import { MAX_NIGHTS, MIN_NIGHTS } from '@/lib/trip';
import { MonthPicker } from './MonthPicker';

const NIGHTS = Array.from({ length: MAX_NIGHTS - MIN_NIGHTS + 1 }, (_, i) => i + MIN_NIGHTS);

/** 날씨 취향 프리셋 (일평균 기온 범위). 맞는 게 없으면 '직접 설정' */
export const CLIMATE_PRESETS = [
  { id: 'cool', label: '선선한 날씨', t: [10, 18] },
  { id: 'mild', label: '쾌적한 날씨', t: [18, 27] },
  { id: 'warm', label: '따뜻한 날씨', t: [24, 32] },
  { id: 'any', label: '어떤 날씨든', t: [TEMP_BOUNDS.min, TEMP_BOUNDS.max] },
] as const;

const presetOf = (p: Prefs) =>
  CLIMATE_PRESETS.find((c) => c.t[0] === p.tMin && c.t[1] === p.tMax)?.id ?? 'custom';

/** 문장형 선택 상자: 밑줄 친 강조 글씨처럼 보이는 select */
const inline =
  'cursor-pointer appearance-none rounded-lg bg-accent-soft px-2.5 py-1 font-bold text-accent focus-visible:outline-2 focus-visible:outline-accent';

/** 여행 조건: 언제(월) · 며칠 · 어떤 날씨 */
export function TripControls({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (p: Partial<Prefs>) => void;
}) {
  const preset = presetOf(prefs);
  return (
    <section aria-label="여행 조건" className="space-y-4">
      <MonthPicker value={prefs.month} onChange={(month) => onChange({ month })} />
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-base sm:text-lg">
        <label>
          <span className="sr-only">여행 기간</span>
          <select
            className={inline}
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
        <span>동안</span>
        <label>
          <span className="sr-only">날씨 취향</span>
          <select
            className={inline}
            value={preset}
            onChange={(e) => {
              const c = CLIMATE_PRESETS.find((x) => x.id === e.target.value);
              if (c) onChange({ tMin: c.t[0], tMax: c.t[1] });
              else onChange({ tMin: prefs.tMin === TEMP_BOUNDS.min ? 15 : prefs.tMin, tMax: 25 });
            }}
          >
            {CLIMATE_PRESETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="custom">직접 설정</option>
          </select>
        </label>
        <span>로 떠나요</span>
        <span className="text-sm text-sub">
          (일평균 {prefs.tMin}~{prefs.tMax}℃)
        </span>
      </p>
      {preset === 'custom' && (
        <fieldset className="grid max-w-xl grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm text-sub">
          <legend className="sr-only">선호 기온 직접 설정</legend>
          <label htmlFor="t-min">최저 {prefs.tMin}℃</label>
          <input
            id="t-min"
            type="range"
            className="w-full min-w-0 accent-sky-700"
            min={TEMP_BOUNDS.min}
            max={TEMP_BOUNDS.max}
            value={prefs.tMin}
            aria-valuetext={`${prefs.tMin}도`}
            onChange={(e) => onChange({ tMin: Math.min(Number(e.target.value), prefs.tMax) })}
          />
          <label htmlFor="t-max">최고 {prefs.tMax}℃</label>
          <input
            id="t-max"
            type="range"
            className="w-full min-w-0 accent-sky-700"
            min={TEMP_BOUNDS.min}
            max={TEMP_BOUNDS.max}
            value={prefs.tMax}
            aria-valuetext={`${prefs.tMax}도`}
            onChange={(e) => onChange({ tMax: Math.max(Number(e.target.value), prefs.tMin) })}
          />
        </fieldset>
      )}
    </section>
  );
}
