import { Suspense } from 'react';
import { loadDestinations, loadPeerStats } from '@/lib/data';
import { MapView } from '@/components/MapView';

export const metadata = { title: '지도로 보기 — 몇 월에 어디 갈까' };

export default function MapPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-extrabold">지도로 보기</h1>
      <p className="mb-4 text-sm text-sub">
        고른 조건의 가성비 점수로 색을 칠했어요. 점을 누르면 요약과 상세 링크가 나와요.
      </p>
      <Suspense fallback={null}>
        <MapView destinations={loadDestinations()} peers={loadPeerStats()} />
      </Suspense>
    </main>
  );
}
