import Link from 'next/link';
import { SCORE_PARAMS as P, SCORE_WEIGHTS as W } from '@/lib/score';

export const metadata = { title: '점수 기준' };

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function ScorePage() {
  const rows = [
    {
      name: '가격',
      max: W.price * 100,
      how: `여행 총액(왕복 항공 중간값 + 1일 경비 × 박수)을 같은 달·같은 박수의 비교 평균과 견줘요. 평균의 ${pct(P.ratioBest)} 이하면 만점, ${pct(P.ratioWorst)} 이상이면 0점, 그 사이는 직선으로 깎여요. 같은 지역에 비교할 도시가 ${P.minRegionPeers}곳 이상이면 지역 평균, 아니면 전체 평균과 비교해요.`,
    },
    {
      name: '날씨',
      max: W.climate * 100,
      how: `일평균 기온((최저+최고)/2)이 내가 고른 선호 범위 안이면 만점, 벗어난 1℃마다 ${P.tempPenaltyPerDeg}점 감점. 월 강수량이 ${P.rainFreeMm}mm를 넘으면 1mm마다 ${P.rainPenaltyPerMm}점(최대 ${P.rainMaxPenalty}점) 감점하고, '비 오는 달 피하기'를 켜면 감점이 ${P.rainAvoidFactor}배가 돼요.`,
    },
    {
      name: '볼거리',
      max: W.theme * 100,
      how: `휴양·미식·도시 같은 테마가 ${P.themeCap}개 이상이면 만점, 적으면 비례로 줄어요.`,
    },
    {
      name: '이동·입국',
      max: W.access * 100,
      how: `이동 부담(왕복 비행시간 ÷ 전체 여행시간)이 ${pct(P.burdenBest)} 이하면 만점, ${pct(P.burdenWorst)} 이상이면 0점. 그래서 먼 곳도 오래 머물수록 부담이 줄어요. 여기에 입국 요건(무비자 ${P.visaScore.free} · 전자여행허가 ${P.visaScore.eta} · 비자 ${P.visaScore.visa})을 ${pct(1 - P.flightShareOfAccess)} 비중으로 섞어요.`,
    },
  ];
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-extrabold">가성비 점수는 이렇게 매겨요</h1>
        <p className="mt-1 text-sm text-sub">
          100점 만점이고, 내가 고른 달·여행 기간·선호 기온에 따라 다시 계산돼요.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-sub">
            <tr>
              <th scope="col" className="p-3">
                항목
              </th>
              <th scope="col" className="p-3">
                배점
              </th>
              <th scope="col" className="p-3">
                계산 방법
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-line align-top">
                <th scope="row" className="p-3 text-left font-semibold">
                  {r.name}
                </th>
                <td className="p-3 font-semibold">{r.max}점</td>
                <td className="p-3 text-sub">{r.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="space-y-2 text-sm">
        <h2 className="text-lg font-bold">정보가 없을 때</h2>
        <p className="text-sub">
          값을 지어내지 않아요. 예를 들어 1일 경비를 모르는 도시는 가격 항목을 빼고, 남은 항목의
          배점을 비율대로 늘려 100점 만점을 맞춰요(카드에 &lsquo;가격 제외&rsquo;로 표시). 그래서
          가격이 반영된 도시와 점수를 그대로 비교하기는 어렵고, &lsquo;이달의 TOP 5&rsquo;는 가격이
          반영된 도시만으로 뽑아요.
        </p>
        <h2 className="pt-2 text-lg font-bold">숫자 읽는 법</h2>
        <p className="text-sub">
          카드의 &lsquo;가격 24/40 · 날씨 27/30 · 볼거리 15/20 · 이동 8/10&rsquo;은 항목별로 받은
          점수/그 항목의 배점이에요. 합치면 총점이 돼요(반올림 차이 ±1~2점).
        </p>
        <p className="text-sub">
          항공값·경비는 웹에서 모은 대략적인 참고값이고 출처·기준일·신뢰도를 상세 페이지에 적어
          두었어요.
        </p>
      </section>
      <Link href="/" className="inline-block text-sm text-link underline">
        ← 여행지 보러 가기
      </Link>
    </main>
  );
}
