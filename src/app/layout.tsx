import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { themeInitScript } from '@/components/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: '몇 월에 어디 갈까 — 시기별 가성비 여행지',
  description: '언제, 며칠, 어떤 날씨로 떠날지 고르면 같은 돈으로 가장 알찬 여행지를 골라 드려요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-canvas text-ink">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
