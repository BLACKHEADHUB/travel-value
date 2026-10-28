import { Suspense } from 'react';
import { loadDestinations, loadPeerStats } from '@/lib/data';
import { Explorer } from '@/components/Explorer';

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Suspense fallback={null}>
        <Explorer destinations={loadDestinations()} peers={loadPeerStats()} />
      </Suspense>
    </main>
  );
}
