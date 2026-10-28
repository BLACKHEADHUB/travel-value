import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '몇 월에 어디 갈까 — 시기별 가성비 여행지',
  description: '월별 기온·항공값·현지 경비로 보는 가성비 여행지 큐레이션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-zinc-900">{children}</body>
    </html>
  );
}
