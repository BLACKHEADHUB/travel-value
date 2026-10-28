import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-sub sm:flex-row sm:items-center sm:justify-between">
        <p>
          항공값·경비는 웹에서 모은 대략적인 참고값이에요. 실제 가격은 검색 링크·판매처에서
          확인하세요.
        </p>
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
