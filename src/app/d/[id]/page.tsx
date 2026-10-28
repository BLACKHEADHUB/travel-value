import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadDestinations } from '@/lib/data';
import { REGION_LABEL } from '@/lib/themes';
import { DetailBody } from '@/components/DetailBody';

export function generateStaticParams() {
  return loadDestinations().map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = loadDestinations().find((x) => x.id === id);
  return { title: d ? `${d.nameKo} — 몇 월에 어디 갈까` : '여행지' };
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = loadDestinations().find((x) => x.id === id);
  if (!d) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/" className="text-sm text-sky-800 underline underline-offset-2">
        ← 목록으로
      </Link>
      <header className="mt-3 mb-5">
        {d.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 정적 export, 외부 Commons 이미지
          <img
            src={d.imageUrl}
            alt={`${d.nameKo} 풍경`}
            className="mb-4 aspect-[2/1] w-full rounded-2xl object-cover"
          />
        )}
        <p className="text-sm text-zinc-600">
          {REGION_LABEL[d.region]} · {d.country}
        </p>
        <h1 className="text-3xl font-extrabold">{d.nameKo}</h1>
        <ul className="mt-2 flex flex-wrap gap-1">
          {d.themes.map((t) => (
            <li key={t} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs">
              {t}
            </li>
          ))}
        </ul>
      </header>
      <Suspense fallback={null}>
        <DetailBody d={d} />
      </Suspense>
    </main>
  );
}
