'use client';
// URL의 여행 조건을 읽고, 그 조건으로 모든 도시 점수를 계산하는 훅
import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DestinationView } from './data';
import { parsePrefs, prefsQuery, type Prefs } from './prefs';
import { scoreDestination, type DestinationScore } from './score';
import type { PeerStats } from './trip';

export function useTrip(destinations: DestinationView[], peers: PeerStats) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = sp.toString();
  const prefs = useMemo(() => parsePrefs(new URLSearchParams(key)), [key]);

  const scores = useMemo(() => {
    const map = new Map<string, DestinationScore>();
    for (const d of destinations) map.set(d.id, scoreDestination(d, prefs, peers));
    return map;
  }, [destinations, prefs, peers]);

  /** 쿼리 일부를 바꾼다 (null이면 삭제) */
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const p = new URLSearchParams(key);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') p.delete(k);
        else p.set(k, v);
      }
      router.replace(`${pathname}?${p}`, { scroll: false });
    },
    [key, pathname, router],
  );

  /** 여행 조건만 바꾼다 (다른 필터 쿼리는 유지) */
  const setPrefs = useCallback(
    (patch: Partial<Prefs>) => {
      const next = new URLSearchParams(prefsQuery({ ...prefs, ...patch }));
      setParams({
        m: next.get('m'),
        n: next.get('n'),
        t: next.get('t'),
        rain: next.get('rain'),
      });
    },
    [prefs, setParams],
  );

  return { prefs, scores, sp, setParams, setPrefs, query: prefsQuery(prefs) };
}
