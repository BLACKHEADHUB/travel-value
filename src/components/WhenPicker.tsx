'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS } from '@/lib/format';
import { dayLabel, nightsLabel, returnDate, whenLabel, type Prefs } from '@/lib/prefs';
import { MAX_NIGHTS, MIN_NIGHTS } from '@/lib/trip';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const QUICK_NIGHTS = [2, 3, 4, 6, 9, 13];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const diffDays = (a: string, b: string) =>
  Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86_400_000);

type Draft = {
  mode: 'date' | 'month';
  start: string | null;
  end: string | null;
  month: number;
  nights: number;
};

/** 한 달 달력 (일요일 시작) */
function MonthGrid({
  year,
  month0,
  draft,
  today,
  onPick,
}: {
  year: number;
  month0: number;
  draft: Draft;
  today: string;
  onPick: (day: string) => void;
}) {
  const first = new Date(year, month0, 1);
  const days = new Date(year, month0 + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: days }, (_, i) => iso(new Date(year, month0, i + 1))),
  ];
  const { start, end } = draft;
  // 시작만 고른 상태에서는 최대 박수를 넘는 날을 막음
  const maxEnd = start && !end ? returnDate(start, MAX_NIGHTS) : null;
  return (
    <div className="min-w-0">
      <p className="mb-2 text-center text-sm font-bold">
        {year}년 {month0 + 1}월
      </p>
      <div className="grid grid-cols-7 text-center text-xs text-sub" aria-hidden>
        {WEEK.map((w, i) => (
          <span
            key={w}
            className={`py-1 ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-600' : ''}`}
          >
            {w}
          </span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-y-1"
        role="grid"
        aria-label={`${year}년 ${month0 + 1}월`}
      >
        {cells.map((day, i) => {
          if (!day) return <span key={`b${i}`} />;
          const past = day < today;
          const tooFar = maxEnd !== null && day > maxEnd;
          const isStart = day === start;
          const isEnd = day === end;
          const inRange = start && end && day > start && day < end;
          const dow = (first.getDay() + Number(day.slice(8)) - 1) % 7;
          return (
            <button
              key={day}
              type="button"
              disabled={past || tooFar}
              onClick={() => onPick(day)}
              aria-pressed={isStart || isEnd}
              aria-label={`${dayLabel(day)}${isStart ? ' 출발' : isEnd ? ' 귀국' : ''}`}
              className={`relative mx-auto grid aspect-square w-full max-w-10 place-items-center text-sm tabular-nums transition focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-25 ${
                isStart || isEnd
                  ? 'rounded-full bg-accent font-bold text-white'
                  : inRange
                    ? 'bg-accent-soft font-medium text-accent'
                    : `rounded-full hover:bg-muted ${dow === 0 ? 'text-rose-500' : dow === 6 ? 'text-sky-600 dark:text-sky-400' : ''}`
              } ${day === today && !isStart && !isEnd ? 'ring-1 ring-line-strong' : ''}`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "언제" 선택: 날짜 지정(달력·범위) 또는 월만 정하기 */
export function WhenPicker({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (p: Partial<Prefs>) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const today = useMemo(() => iso(new Date()), []);

  const initial = (): Draft => ({
    mode: 'date',
    start: prefs.date,
    end: prefs.date ? returnDate(prefs.date, prefs.nights) : null,
    month: prefs.month,
    nights: prefs.nights,
  });
  const [draft, setDraft] = useState<Draft>(initial);
  /** 달력 첫 화면: 출발일이 있으면 그 달, 없으면 고른 월(지났으면 내년) */
  const baseView = () => {
    if (prefs.date) {
      const b = fromIso(prefs.date);
      return { y: b.getFullYear(), m0: b.getMonth() };
    }
    const now = new Date();
    const y = prefs.month - 1 < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
    return { y, m0: prefs.month - 1 };
  };
  const [view, setView] = useState(baseView);

  const openPanel = () => {
    setDraft(initial());
    setView(baseView());
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pick = (day: string) =>
    setDraft((d) => {
      // 시작 전 / 범위가 이미 있음 / 시작보다 앞 → 새 출발일
      if (!d.start || d.end || day <= d.start) return { ...d, start: day, end: null };
      return { ...d, end: day, nights: diffDays(d.start, day) };
    });
  const quick = (n: number) =>
    setDraft((d) =>
      d.start ? { ...d, end: returnDate(d.start, n), nights: n } : { ...d, nights: n },
    );

  const shift = (k: number) =>
    setView((v) => {
      const dt = new Date(v.y, v.m0 + k, 1);
      return { y: dt.getFullYear(), m0: dt.getMonth() };
    });
  const next = new Date(view.y, view.m0 + 1, 1);
  const canPrev =
    new Date(view.y, view.m0, 1) > new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const ready = draft.mode === 'month' || (draft.start && draft.end);
  const apply = () => {
    if (draft.mode === 'month') onChange({ month: draft.month, date: null, nights: draft.nights });
    else if (draft.start && draft.end)
      onChange({
        date: draft.start,
        nights: diffDays(draft.start, draft.end),
        month: Number(draft.start.slice(5, 7)),
      });
    close();
  };

  const summary =
    draft.mode === 'month'
      ? `${draft.month}월 중 · ${nightsLabel(draft.nights)}`
      : draft.start && draft.end
        ? `${dayLabel(draft.start)} → ${dayLabel(draft.end)} · ${nightsLabel(diffDays(draft.start, draft.end))}`
        : draft.start
          ? `${dayLabel(draft.start)} 출발 · 귀국일을 골라 주세요`
          : '출발일을 골라 주세요';

  const tab = (on: boolean) =>
    `flex-1 rounded-full py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-accent ${
      on ? 'bg-surface text-ink shadow-sm' : 'text-sub hover:text-ink'
    }`;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={openPanel}
        aria-haspopup="dialog"
        className="group flex w-full min-w-0 flex-col items-start rounded-2xl px-4 py-2.5 text-left transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="text-xs font-semibold text-sub">언제</span>
        <span className="truncate font-bold">{whenLabel(prefs)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="when-title"
            tabIndex={-1}
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl outline-none sm:max-w-2xl sm:rounded-3xl sm:p-7"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <h2 id="when-title" className="text-xl font-extrabold tracking-tight">
                언제 떠나세요?
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="grid size-9 place-items-center rounded-full text-sub hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                ✕
              </button>
            </div>

            <div
              className="mb-5 flex rounded-full bg-muted p-1"
              role="tablist"
              aria-label="선택 방식"
            >
              <button
                type="button"
                role="tab"
                aria-selected={draft.mode === 'date'}
                className={tab(draft.mode === 'date')}
                onClick={() => setDraft((d) => ({ ...d, mode: 'date' }))}
              >
                날짜 지정
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={draft.mode === 'month'}
                className={tab(draft.mode === 'month')}
                onClick={() => setDraft((d) => ({ ...d, mode: 'month' }))}
              >
                월만 정하기
              </button>
            </div>

            {draft.mode === 'date' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => shift(-1)}
                    disabled={!canPrev}
                    aria-label="이전 달"
                    className="grid size-9 place-items-center rounded-full hover:bg-muted disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    ‹
                  </button>
                  <p className="text-xs text-sub">
                    출발일과 귀국일을 차례로 눌러 주세요 (최대 {MAX_NIGHTS}박)
                  </p>
                  <button
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="다음 달"
                    className="grid size-9 place-items-center rounded-full hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    ›
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <MonthGrid
                    year={view.y}
                    month0={view.m0}
                    draft={draft}
                    today={today}
                    onPick={pick}
                  />
                  <div className="hidden sm:block">
                    <MonthGrid
                      year={next.getFullYear()}
                      month0={next.getMonth()}
                      draft={draft}
                      today={today}
                      onPick={pick}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-sub">여행 길이 빠르게 고르기</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NIGHTS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={!draft.start}
                        onClick={() => quick(n)}
                        aria-pressed={!!draft.end && draft.nights === n}
                        className={`rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 ${
                          draft.end && draft.nights === n
                            ? 'bg-ink text-surface'
                            : 'bg-muted text-sub hover:text-ink'
                        }`}
                      >
                        {nightsLabel(n)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={draft.month === m}
                      onClick={() => setDraft((d) => ({ ...d, month: m }))}
                      className={`rounded-2xl py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-accent ${
                        draft.month === m
                          ? 'bg-ink text-surface'
                          : 'bg-muted text-sub hover:text-ink'
                      }`}
                    >
                      {m}월
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-sub">여행 길이</span>
                  <select
                    className="rounded-xl bg-muted px-3 py-2 ring-1 ring-line focus-visible:outline-2 focus-visible:outline-accent"
                    value={draft.nights}
                    onChange={(e) => setDraft((d) => ({ ...d, nights: Number(e.target.value) }))}
                  >
                    {Array.from(
                      { length: MAX_NIGHTS - MIN_NIGHTS + 1 },
                      (_, i) => i + MIN_NIGHTS,
                    ).map((n) => (
                      <option key={n} value={n}>
                        {nightsLabel(n)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="sticky bottom-0 -mx-5 mt-6 flex items-center gap-3 border-t border-line bg-surface px-5 pt-4 sm:-mx-7 sm:px-7">
              <p className="min-w-0 flex-1 text-sm" aria-live="polite">
                {summary}
              </p>
              {draft.mode === 'date' && draft.start && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, start: null, end: null }))}
                  className="text-sm text-sub underline-offset-2 hover:underline"
                >
                  초기화
                </button>
              )}
              <button
                type="button"
                onClick={apply}
                disabled={!ready}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
