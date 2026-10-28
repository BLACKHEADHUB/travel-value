import Link from 'next/link';
import { scorePoints, type ScoreResult } from '@/lib/score';

export const PART_SHORT = {
  price: '가격',
  climate: '날씨',
  theme: '볼거리',
  access: '이동',
} as const;
const PART_COLOR = {
  price: 'bg-emerald-500',
  climate: 'bg-sky-500',
  theme: 'bg-violet-500',
  access: 'bg-amber-500',
} as const;

/**
 * 항목별 점수.
 * 기본: 막대(폭 = 항목 배점, 채움 = 받은 점수) + 4칸 "가격 35/40".
 * compact: 한 줄 텍스트 "가격 35/40 · 날씨 …".
 */
export function ScoreBreakdown({
  score,
  compact = false,
  showLink = false,
}: {
  score: ScoreResult;
  compact?: boolean;
  showLink?: boolean;
}) {
  const pts = scorePoints(score);
  const value = (p: (typeof pts)[number]) =>
    p.got === null ? (
      <span title="정보가 없어 이 항목을 빼고 계산">제외</span>
    ) : (
      <>
        <b className="font-semibold text-ink tabular-nums">{p.got}</b>
        <span className="text-sub">/{p.max}</span>
      </>
    );

  if (compact) {
    return (
      <p className="text-xs text-sub">
        {pts.map((p, i) => (
          <span key={p.key}>
            {i > 0 && ' · '}
            {PART_SHORT[p.key]} {value(p)}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {pts
          .filter((p) => p.max > 0)
          .map((p) => (
            <div key={p.key} className="h-full bg-muted" style={{ width: `${p.max}%` }}>
              <div
                className={`h-full ${PART_COLOR[p.key]}`}
                style={{ width: `${((p.got ?? 0) / p.max) * 100}%` }}
              />
            </div>
          ))}
      </div>
      <dl className="grid grid-cols-4 gap-1 text-xs">
        {pts.map((p) => (
          <div key={p.key} className="min-w-0">
            <dt className="flex items-center gap-1 text-sub">
              <span className={`size-1.5 shrink-0 rounded-full ${PART_COLOR[p.key]}`} aria-hidden />
              {PART_SHORT[p.key]}
            </dt>
            <dd className="text-sub">{value(p)}</dd>
          </div>
        ))}
      </dl>
      {showLink && (
        <Link
          href="/score/"
          className="relative z-10 inline-block text-xs text-accent underline-offset-2 hover:underline"
        >
          점수 기준 보기
        </Link>
      )}
    </div>
  );
}
