'use client';
import { useSyncExternalStore } from 'react';

const KEY = 'tv-theme';
const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => mo.disconnect();
};

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      // 저장 불가: 이번 방문에만 적용
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? '라이트 모드로 바꾸기' : '다크 모드로 바꾸기'}
      title={dark ? '라이트 모드' : '다크 모드'}
      className="grid size-9 place-items-center rounded-full text-sub hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span aria-hidden className="text-lg leading-none">
        {dark ? '☀' : '☾'}
      </span>
    </button>
  );
}

/** 첫 페인트 전에 테마 적용 (깜빡임 방지). 저장값 없으면 OS 설정 */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`;
