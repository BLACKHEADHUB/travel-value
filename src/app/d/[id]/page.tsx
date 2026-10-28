import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadDestinations, loadPeerStats } from '@/lib/data';
import { REGION_LABEL } from '@/lib/themes';
import { DetailBody } from '@/components/DetailBody';
import { ShareButton } from '@/components/ShareButton';

export function generateStaticParams() {
  return loadDestinations().map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = loadDestinations().find((x) => x.id === id);
  if (!d) return { title: '여행지' };
  const title = `${d.nameKo} 제철 정보`;
  const description = `${d.country} ${d.nameKo} — 달마다 날씨·항공값·경비로 매긴 가성비 점수와 제철 달력.`;
  return {
    title,
    description,
    openGraph: { title, description, images: d.imageUrl ? [{ url: d.imageUrl }] : [] },
  };
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = loadDestinations().find((x) => x.id === id);
  if (!d) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-300 to-emerald-200">
        {d.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 export, 외부 Commons 이미지
          <img
            src={d.imageUrl}
            alt={`${d.nameKo} 풍경`}
            className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />
        <div className="absolute inset-x-4 top-4 flex justify-between">
          <Link
            href="/"
            className="rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
          >
            ← 목록
          </Link>
          <ShareButton title={`${d.nameKo} 제철 정보 · 제철여행`} />
        </div>
        <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-8 sm:bottom-7">
          <p className="text-sm text-white/80">
            {REGION_LABEL[d.region]} · {d.country}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{d.nameKo}</h1>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {d.themes.map((t) => (
              <li
                key={t}
                className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs backdrop-blur-sm"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>
      <Suspense fallback={null}>
        <DetailBody d={d} peers={loadPeerStats()} />
      </Suspense>
    </main>
  );
}
