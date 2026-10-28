import Link from 'next/link';
import { BRAND, LogoMark } from './Logo';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-sub sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-ink">
            <LogoMark className="size-5" /> {BRAND.name}
            <span className="font-normal text-sub">· {BRAND.tagline}</span>
          </p>
          <p>
            항공값·경비는 웹에서 모은 대략적인 참고값이에요. 실제 가격은 검색 링크·판매처에서
            확인하세요.
          </p>
        </div>
        <nav aria-label="보조 메뉴" className="flex gap-4">
          <Link href="/quiz/" className="hover:text-ink">
            추천 퀴즈
          </Link>
          <Link href="/score/" className="hover:text-ink">
            점수 기준
          </Link>
          <a
            href="https://github.com/BLACKHEADHUB/travel-value"
            className="hover:text-ink"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
