'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COMPARE_KEY, COMPARE_MAX, FAV_KEY, useStoredList } from '@/lib/storage';
import { ThemeToggle } from './ThemeToggle';
import { BRAND, LogoMark } from './Logo';

export function SiteNav() {
  const path = usePathname();
  const fav = useStoredList(FAV_KEY);
  const cmp = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const link = (href: string, label: React.ReactNode, active: boolean, aria?: string) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={aria}
      className={`rounded-full px-2.5 py-1.5 text-sm whitespace-nowrap transition sm:px-3 focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'bg-ink font-semibold text-surface' : 'text-sub hover:text-ink'
      }`}
    >
      {label}
    </Link>
  );
  const count = (n: number) =>
    n ? (
      <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
        {n}
      </span>
    ) : null;
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-md">
      <nav
        aria-label="주요 메뉴"
        className="mx-auto flex h-14 max-w-6xl items-center gap-0.5 px-3 sm:gap-1 sm:px-4"
      >
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight whitespace-nowrap">
            {BRAND.name}
          </span>
        </Link>
        {link('/', '여행지', path === '/')}
        {link('/map/', '지도', path.startsWith('/map'))}
        {link('/compare/', <>비교{count(cmp.list.length)}</>, path.startsWith('/compare'))}
        {link('/?fav=1', <>★{count(fav.list.length)}</>, false, `즐겨찾기 ${fav.list.length}곳`)}
        <ThemeToggle />
      </nav>
    </header>
  );
}
