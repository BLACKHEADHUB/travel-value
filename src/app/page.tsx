import { Suspense } from 'react';
import { loadDestinations, loadPeerStats } from '@/lib/data';
import { Explorer } from '@/components/Explorer';

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">몇 월에 어디 갈까?</h1>
        <p className="mt-1 text-sm text-sub">
          언제, 며칠, 어떤 날씨를 원하는지 고르면 같은 돈으로 가장 알차게 다녀올 곳을 골라 드려요.
        </p>
      </header>
      <Suspense fallback={null}>
        <Explorer destinations={loadDestinations()} peers={loadPeerStats()} />
      </Suspense>
    </main>
  );
}
