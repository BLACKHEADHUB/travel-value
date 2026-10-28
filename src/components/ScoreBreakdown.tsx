import Link from 'next/link';
import { scorePoints, type ScoreResult } from '@/lib/score';

export const PART_SHORT = {
  price: '가격',
  climate: '날씨',
  theme: '볼거리',
  access: '이동',
} as const;

/** "가격 24/40 · 날씨 27/30 …" 형식의 항목별 점수 */
export function ScoreBreakdown({
  score,
  compact = false,
}: {
  score: ScoreResult;
  compact?: boolean;
}) {
  const pts = scorePoints(score);
  return (
    <p className={`text-xs text-sub ${compact ? '' : 'leading-relaxed'}`}>
      {pts.map((p, i) => (
        <span key={p.key}>
          {i > 0 && ' · '}
          {PART_SHORT[p.key]}{' '}
          {p.got === null ? (
            <span title="정보가 없어 이 항목을 빼고 계산">제외</span>
          ) : (
            <b className="font-semibold text-ink">
              {p.got}/{p.max}
            </b>
          )}
        </span>
      ))}
      {!compact && (
        <>
          {' '}
          <Link href="/score/" className="relative z-10 text-link underline">
            기준
          </Link>
        </>
      )}
    </p>
  );
}
