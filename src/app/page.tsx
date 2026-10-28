import { Suspense } from 'react';
import { loadDestinations } from '@/lib/data';
import { Explorer } from '@/components/Explorer';

export default function Home() {
  const destinations = loadDestinations();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">몇 월에 어디 갈까?</h1>
        <p className="mt-1 text-sm text-sub">
          월을 고르면 그때 가기 좋은 가성비 여행지를 기온·항공값·현지 경비와 함께 보여드려요.
        </p>
      </header>
      <Suspense fallback={null}>
        <Explorer destinations={destinations} />
      </Suspense>
    </main>
  );
}
