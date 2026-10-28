// 병렬 수집용 스테이징.
//   검사: npx tsx scripts/staging.ts check <file>   (스키마만, 환율·기후 없이)
//   병합: npx tsx scripts/staging.ts merge          (data/staging/*.json → data/destinations/<region>.json, 같은 id는 교체)
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { destinationFileSchema, type Destination } from '../src/lib/schema';

const [cmd, file] = process.argv.slice(2);
const dir = join(process.cwd(), 'data', 'staging');

function parse(path: string): Destination[] {
  const r = destinationFileSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!r.success) {
    for (const i of r.error.issues.slice(0, 30))
      console.error(`✗ ${i.path.join('.')}: ${i.message}`);
    process.exit(1);
  }
  for (const d of r.data) {
    for (const m of d.monthly) {
      const fp = m.flightPrice;
      if ((fp.min !== null || fp.max !== null) && (!fp.source || !fp.asOf))
        throw new Error(`${d.id} ${m.month}월: 항공값 source/asOf 누락`);
      if (m.dailyCost.local && (m.dailyCost.total !== null || m.dailyCost.fx))
        throw new Error(`${d.id}: local이 있으면 KRW 칸과 fx는 비워 둔다`);
    }
    if (d.flightPriceTypical.min !== null && !d.flightPriceTypical.source)
      throw new Error(`${d.id}: 연중 대표가 source 누락`);
  }
  return r.data;
}

if (cmd === 'check') {
  const ds = parse(file);
  console.log(`OK ${ds.length}곳: ${ds.map((d) => `${d.id}(${d.region})`).join(', ')}`);
} else if (cmd === 'merge') {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const byRegion = new Map<string, Destination[]>();
  for (const f of files)
    for (const d of parse(join(dir, f)))
      byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);
  for (const [region, add] of byRegion) {
    const target = join(process.cwd(), 'data', 'destinations', `${region}.json`);
    const cur: Destination[] = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : [];
    const ids = new Set(add.map((d) => d.id));
    const next = [...cur.filter((d) => !ids.has(d.id)), ...add];
    writeFileSync(target, JSON.stringify(next, null, 2) + '\n');
    console.log(`${region}: +${add.length} → ${next.length}곳`);
  }
  for (const f of files) unlinkSync(join(dir, f));
} else {
  console.error('사용법: staging.ts check <file> | merge');
  process.exit(1);
}
