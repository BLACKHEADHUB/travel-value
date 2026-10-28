'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COMPARE_KEY, COMPARE_MAX, FAV_KEY, useStoredList } from '@/lib/storage';
import { ThemeToggle } from './ThemeToggle';

export function SiteNav() {
  const path = usePathname();
  const fav = useStoredList(FAV_KEY);
  const cmp = useStoredList(COMPARE_KEY, COMPARE_MAX);
  const link = (href: string, label: React.ReactNode, active: boolean, aria?: string) => (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      aria-label={aria}
      className={`rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-accent ${
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
      <nav aria-label="주요 메뉴" className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <Link href="/" className="mr-auto flex items-center gap-1.5 font-extrabold tracking-tight">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-white"
          >
            ✈
          </span>
          <span className="hidden sm:inline">몇 월에 어디 갈까</span>
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
