'use client';
import { useEffect, useRef } from 'react';
import { MONTHS } from '@/lib/format';

export function MonthPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // 선택된 월이 가로 스크롤 밖에 있으면 보이게 (모바일)
    const el = ref.current?.children[value - 1] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [value]);
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label="여행 월 선택"
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-12 sm:px-0"
    >
      {MONTHS.map((m) => {
        const on = m === value;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            onKeyDown={(e) => {
              const next =
                e.key === 'Home'
                  ? 1
                  : e.key === 'End'
                    ? 12
                    : e.key === 'ArrowRight'
                      ? (m % 12) + 1
                      : e.key === 'ArrowLeft'
                        ? ((m + 10) % 12) + 1
                        : null;
              if (next === null) return;
              e.preventDefault();
              onChange(next);
              (
                e.currentTarget.parentElement?.children[next - 1] as HTMLElement | undefined
              )?.focus();
            }}
            tabIndex={on ? 0 : -1}
            className={`min-w-14 shrink-0 rounded-xl py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-w-0 ${
              on
                ? 'bg-ink text-surface shadow-sm'
                : 'bg-surface text-sub ring-1 ring-line hover:text-ink hover:ring-line-strong'
            }`}
          >
            {m}월
          </button>
        );
      })}
    </div>
  );
}
