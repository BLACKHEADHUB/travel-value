// Wikimedia Commons 파일(imageFile)의 작가·라이선스를 API로 확인해 imageUrl/imageCredit을 채운다.
// 사용: npm run fetch:images   (라이선스 확인 실패 시 해당 도시는 null 유지)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { destinationFileSchema } from '../src/lib/schema';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'travel-value-dev/0.1 (static travel guide; image credit lookup)';
const ALLOWED = /^(CC0|CC BY(-SA)? [0-9.]+|Public domain|PD)/i;
const strip = (h: string) =>
  h
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

type Info = {
  thumburl?: string;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string }>;
};

async function lookup(file: string) {
  const url = `${API}?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&titles=${encodeURIComponent('File:' + file)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { query: { pages: Record<string, { imageinfo?: Info[] }> } };
  const info = Object.values(json.query.pages)[0]?.imageinfo?.[0];
  if (!info?.thumburl || !info.extmetadata) throw new Error('파일 없음');
  const license = strip(info.extmetadata.LicenseShortName?.value ?? '');
  const author = strip(info.extmetadata.Artist?.value ?? '');
  if (!ALLOWED.test(license)) throw new Error(`허용되지 않은 라이선스: ${license || '없음'}`);
  if (!author) throw new Error('작가 정보 없음');
  return {
    imageUrl: info.thumburl,
    imageCredit: { author, license, sourceUrl: info.descriptionurl },
  };
}

async function main() {
  const dir = join(process.cwd(), 'data', 'destinations');
  let failed = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const p = join(dir, f);
    const dests = destinationFileSchema.parse(JSON.parse(readFileSync(p, 'utf8')));
    for (const d of dests) {
      if (!d.imageFile) continue;
      try {
        Object.assign(d, await lookup(d.imageFile));
        console.log(`✓ ${d.id}: ${d.imageCredit?.license}`);
      } catch (e) {
        failed++;
        console.warn(`✗ ${d.id}: ${(e as Error).message}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    writeFileSync(p, JSON.stringify(dests, null, 2) + '\n');
  }
  if (failed) console.warn(`${failed}개 실패 — 나중에 다시 실행하세요.`);
}

main();
