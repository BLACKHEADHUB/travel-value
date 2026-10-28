// 파이프라인 end-to-end 확인: 데이터 로드 → 기후 병합 → 점수. 사용: npm run report [-- <month> [nights]]
import { loadDestinations, loadPeerStats } from '../src/lib/data';
import { parsePrefs } from '../src/lib/prefs';
import { scoreDestination } from '../src/lib/score';

const prefs = parsePrefs(
  new URLSearchParams({ m: process.argv[2] ?? '', n: process.argv[3] ?? '' }),
);
const peers = loadPeerStats();
const rows = loadDestinations()
  .map((d) => {
    const m = d.months[prefs.month - 1];
    const s = scoreDestination(d, prefs, peers);
    return {
      id: d.id,
      temp: m.avgTempMin === null ? '정보 없음' : `${m.avgTempMin}~${m.avgTempMax}℃`,
      rain: m.rainfallMm ?? '정보 없음',
      total: s.totalCost ?? '정보 없음',
      score: s.total ?? '정보 없음',
      basis: s.priceBasis ?? '-',
      pkgs: d.packages.length,
    };
  })
  .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
console.log(`${prefs.month}월 ${prefs.nights}박`);
console.table(rows);
