'use client';
// localStorage 기반 목록(즐겨찾기·비교 선택). 접근 실패(사파리 프라이빗 등)해도 화면은 동작한다.
import { useCallback, useSyncExternalStore } from 'react';

const EVENT = 'tv-storage';
const cache = new Map<string, { raw: string | null; list: string[] }>();

function read(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.list; // 같은 참조 유지 (useSyncExternalStore 요구)
  let list: string[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) list = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    list = [];
  }
  cache.set(key, { raw, list });
  return list;
}

function write(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // 저장 불가 환경: 무시
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
};
const EMPTY: string[] = [];

export function useStoredList(key: string, max = Infinity) {
  const list = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );
  const toggle = useCallback(
    (id: string) => {
      const cur = read(key);
      if (cur.includes(id))
        write(
          key,
          cur.filter((x) => x !== id),
        );
      else if (cur.length < max) write(key, [...cur, id]);
    },
    [key, max],
  );
  const clear = useCallback(() => write(key, []), [key]);
  return { list, toggle, clear, full: list.length >= max };
}

export const FAV_KEY = 'tv-favorites';
export const COMPARE_KEY = 'tv-compare';
export const COMPARE_MAX = 3;
