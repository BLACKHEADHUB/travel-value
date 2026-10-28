// 현지 통화로 수집한 1일 경비(dailyCost.local)를 최신 환율로 KRW 환산.
// 사용: npm run fx   (환율 스냅샷은 data/fx.json에 기록, 다시 돌리면 갱신)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { destinationFileSchema } from '../src/lib/schema';

const SOURCE = 'https://open.er-api.com/v6/latest/KRW (ExchangeRate-API)';
const root = process.cwd();
const round100 = (n: number) => Math.round(n / 100) * 100;

async function main() {
  const res = await fetch('https://open.er-api.com/v6/latest/KRW');
  if (!res.ok) throw new Error(`환율 API ${res.status}`);
  const json = (await res.json()) as {
    result: string;
    time_last_update_unix: number;
    rates: Record<string, number>;
  };
  if (json.result !== 'success') throw new Error('환율 API 실패');
  const date = new Date(json.time_last_update_unix * 1000).toISOString().slice(0, 10);
  const krwPer = (cur: string) => {
    const r = json.rates[cur];
    if (!r) throw new Error(`환율 없음: ${cur}`);
    return 1 / r;
  };

  const used: Record<string, number> = {};
  const dir = join(root, 'data', 'destinations');
  let converted = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const p = join(dir, f);
    const dests = destinationFileSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
    for (const d of dests) {
      for (const m of d.monthly) {
        const l = m.dailyCost.local;
        if (!l) continue;
        const rate = krwPer(l.currency);
        used[l.currency] = Math.round(rate * 1000) / 1000;
        const k = (v: number | null) => (v === null ? null : round100(v * rate));
        Object.assign(m.dailyCost, {
          total: k(l.total),
          lodging: k(l.lodging),
          food: k(l.food),
          transport: k(l.transport),
          fx: { rate: used[l.currency], date, source: SOURCE },
        });
        converted++;
      }
    }
    writeFileSync(p, JSON.stringify(dests, null, 2) + '\n');
  }
  writeFileSync(
    join(root, 'data', 'fx.json'),
    JSON.stringify({ source: SOURCE, date, krwPer: used }, null, 2) + '\n',
  );
  console.log(`환율 기준일 ${date}, ${converted}개 월 데이터 환산`, used);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
