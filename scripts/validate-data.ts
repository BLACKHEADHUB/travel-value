// Phase 1에서 zod 스키마 기반 검증으로 확장. 지금은 data/ 구조만 확인하는 뼈대.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dirs = ['destinations', 'climate', 'packages'];
let errors = 0;
for (const d of dirs) {
  const p = join(process.cwd(), 'data', d);
  if (!existsSync(p)) {
    console.error(`missing data/${d}`);
    errors++;
    continue;
  }
  const files = readdirSync(p).filter((f) => f.endsWith('.json'));
  console.log(`data/${d}: ${files.length} file(s)`);
}
if (errors) process.exit(1);
console.log('validate-data: OK (skeleton)');
