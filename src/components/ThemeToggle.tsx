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
      className="rounded-full border border-line-strong px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-sky-600"
    >
      {dark ? '라이트 모드' : '다크 모드'}
    </button>
  );
}

/** 첫 페인트 전에 테마 적용 (깜빡임 방지). 저장값 없으면 OS 설정 */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`;
