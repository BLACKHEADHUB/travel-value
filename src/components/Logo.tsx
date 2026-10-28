/** 제철여행 로고: 잎 하나 (계절·제철) */
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <path d="M9 23c0-8 5.5-13.5 14-14 .2 8.6-5.4 14.2-14 14Z" fill="#fff" opacity=".95" />
      <path d="M9 23 19 13" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export const BRAND = {
  name: '제철여행',
  tagline: '여행에도 제철이 있어요',
  description: '언제·며칠·어떤 날씨를 고르면, 그때 가장 알맞고 알찬 여행지를 골라 드려요.',
} as const;
