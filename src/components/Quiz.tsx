'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTHS } from '@/lib/format';
import { DEFAULT_TEMP, nightsLabel, prefsQuery } from '@/lib/prefs';
import { THEMES } from '@/lib/themes';
import { DEFAULT_NIGHTS, MAX_NIGHTS, MIN_NIGHTS } from '@/lib/trip';

const CLIMATES = [
  { id: 'cool', label: '선선한 게 좋아요', hint: '일평균 10~18℃', t: [10, 18] },
  { id: 'mild', label: '딱 좋은 날씨', hint: '18~27℃', t: [DEFAULT_TEMP.tMin, DEFAULT_TEMP.tMax] },
  { id: 'warm', label: '더워도 괜찮아요', hint: '24~32℃ (휴양지)', t: [24, 32] },
  { id: 'any', label: '상관없어요', hint: '-10~35℃', t: [-10, 35] },
] as const;
const BUDGETS = [50, 100, 150, 200, 300, 400, 500];

export function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [nights, setNights] = useState(DEFAULT_NIGHTS);
  const [budget, setBudget] = useState<number | null>(null);
  const [themes, setThemes] = useState<string[]>([]);
  const [climate, setClimate] = useState<(typeof CLIMATES)[number]['id']>('mild');
  const [rainAvoid, setRainAvoid] = useState(false);

  const finish = () => {
    const c = CLIMATES.find((x) => x.id === climate)!;
    const q = new URLSearchParams(
      prefsQuery({ month, nights, tMin: c.t[0], tMax: c.t[1], rainAvoid }),
    );
    if (budget) q.set('budget', String(budget));
    if (themes.length) q.set('theme', themes.join(','));
    router.push(`/?${q}`);
  };

  const opt = (on: boolean) =>
    `rounded-xl border px-3 py-2.5 text-sm text-left focus-visible:outline-2 focus-visible:outline-sky-600 ${
      on
        ? 'border-sky-700 bg-sky-700 text-white'
        : 'border-line-strong bg-surface hover:border-sky-600'
    }`;

  const steps = [
    {
      q: '언제 떠나요?',
      body: (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={month === m}
              className={opt(month === m)}
              onClick={() => setMonth(m)}
            >
              {m}월
            </button>
          ))}
        </div>
      ),
    },
    {
      q: '며칠 다녀와요?',
      body: (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: MAX_NIGHTS - MIN_NIGHTS + 1 }, (_, i) => i + MIN_NIGHTS).map(
            (n) => (
              <button
                key={n}
                type="button"
                aria-pressed={nights === n}
                className={opt(nights === n)}
                onClick={() => setNights(n)}
              >
                {nightsLabel(n)}
              </button>
            ),
          )}
        </div>
      ),
    },
    {
      q: '1인 총예산은요? (항공 + 현지 경비)',
      body: (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            aria-pressed={budget === null}
            className={opt(budget === null)}
            onClick={() => setBudget(null)}
          >
            정하지 않음
          </button>
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={budget === b}
              className={opt(budget === b)}
              onClick={() => setBudget(b)}
            >
              {b}만 원 이하
            </button>
          ))}
        </div>
      ),
    },
    {
      q: '어떤 여행을 원해요? (여러 개 선택)',
      body: (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((t) => {
            const on = themes.includes(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                className={opt(on)}
                onClick={() => setThemes(on ? themes.filter((x) => x !== t) : [...themes, t])}
              >
                {t}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      q: '날씨 취향은요?',
      body: (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {CLIMATES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={climate === c.id}
                className={opt(climate === c.id)}
                onClick={() => setClimate(c.id)}
              >
                <span className="block font-semibold">{c.label}</span>
                <span className="text-xs opacity-80">{c.hint}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-sky-700"
              checked={rainAvoid}
              onChange={(e) => setRainAvoid(e.target.checked)}
            />
            비 오는 달은 피하고 싶어요
          </label>
        </div>
      ),
    },
  ];
  const last = step === steps.length - 1;

  return (
    <section
      aria-labelledby="quiz-q"
      className="space-y-5 rounded-2xl border border-line bg-surface-2 p-5"
    >
      <p className="text-xs text-sub" aria-live="polite">
        {step + 1} / {steps.length}
      </p>
      <h2 id="quiz-q" className="text-xl font-bold">
        {steps[step].q}
      </h2>
      {steps[step].body}
      <div className="flex justify-between gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="rounded-xl border border-line-strong px-4 py-2.5 text-sm disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-sky-600"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => (last ? finish() : setStep(step + 1))}
          className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          {last ? '추천 보기' : '다음'}
        </button>
      </div>
    </section>
  );
}
