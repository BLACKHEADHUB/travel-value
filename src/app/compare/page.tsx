import { Suspense } from 'react';
import { loadDestinations, loadPeerStats } from '@/lib/data';
import { CompareView } from '@/components/CompareView';

export const metadata = { title: '여행지 비교' };

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-extrabold">여행지 비교</h1>
      <p className="mb-5 text-sm text-sub">
        같은 달 기준으로 최대 3곳의 날씨·비용·입국 조건과 자유여행 vs 패키지 판정을 나란히 봐요.
      </p>
      <Suspense fallback={null}>
        <CompareView destinations={loadDestinations()} peers={loadPeerStats()} />
      </Suspense>
    </main>
  );
}
