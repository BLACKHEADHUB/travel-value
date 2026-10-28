import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

export const metadata = { title: '페이지를 찾을 수 없어요' };

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <LogoMark className="size-14" />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">아직 제철이 아닌 페이지예요</h1>
      <p className="mt-2 text-sub">주소가 바뀌었거나 없는 여행지예요.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        제철 여행지 보러 가기
      </Link>
    </main>
  );
}
