'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COMPARE_KEY, COMPARE_MAX, FAV_KEY, useStoredList } from '@/lib/storage';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/', label: '여행지' },
  { href: '/map/', label: '지도' },
  { href: '/quiz/', label: '추천 퀴즈' },
] as const;

export function SiteNav() {
  const path = usePathname();
  const fav = useStoredList(FAV_KEY);
  const cmp = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const item = (href: string, label: string) => {
    // 쿼리 링크(즐겨찾기)는 같은 경로라 활성 표시하지 않음
    const on = href.includes('?')
      ? false
      : href === '/'
        ? path === '/'
        : path.startsWith(href.replace(/\/$/, ''));
    return (
      <Link
        key={href}
        href={href}
        aria-current={on ? 'page' : undefined}
        className={`rounded-full px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-sky-600 ${
          on ? 'bg-muted font-semibold' : 'hover:bg-muted'
        }`}
      >
        {label}
      </Link>
    );
  };
  return (
    <header className="border-b border-line bg-surface">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2"
      >
        <Link href="/" className="mr-2 font-extrabold tracking-tight">
          몇 월에 어디 갈까
        </Link>
        {LINKS.map((l) => item(l.href, l.label))}
        {item('/compare/', `비교${cmp.list.length ? ` (${cmp.list.length})` : ''}`)}
        {item('/?fav=1', `즐겨찾기${fav.list.length ? ` (${fav.list.length})` : ''}`)}
        <span className="ml-auto">
          <ThemeToggle />
        </span>
      </nav>
    </header>
  );
}
