// 파이프라인 end-to-end 확인: 데이터 로드 → 기후 병합 → 점수. 사용: npm run report [-- <month>]
import { loadDestinations } from '../src/lib/data';

const month = Number(process.argv[2]) || new Date().getMonth() + 1;
const rows = loadDestinations()
  .map((d) => {
    const m = d.months[month - 1];
    return {
      id: d.id,
      temp: m.avgTempMin === null ? '정보 없음' : `${m.avgTempMin}~${m.avgTempMax}℃`,
      rain: m.rainfallMm ?? '정보 없음',
      total: m.totalCost ?? '정보 없음',
      score: m.score.total ?? '정보 없음',
      basis: m.priceBasis ?? '-',
      pkgs: d.packages.length,
    };
  })
  .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
console.log(`${month}월`);
console.table(rows);
