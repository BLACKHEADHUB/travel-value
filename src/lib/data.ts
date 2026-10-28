// 빌드 시점(서버)에서 data/를 읽어 도시 + 기후 + 패키지 + 점수를 합친다. 클라이언트에서 import 금지.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  climateFileSchema,
  destinationFileSchema,
  packageFileSchema,
  type Destination,
  type PackageTour,
} from './schema';
import { computeScore, type ScoreResult } from './score';

/** 점수·비교의 기본 일정 (3박 4일 / 4박 5일 중 기본) */
export const DEFAULT_NIGHTS = 4;
/** 지역 내 비교 가능한 도시가 이보다 적으면 전체 평균으로 대체 */
const MIN_REGION_PEERS = 3;

export type MonthView = Destination['monthly'][number] & {
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainfallMm: number | null;
  /** 실제 표시용 항공가 (월별 없으면 연중 대표가, typical=true) */
  flight: ReturnType<typeof flightFor>;
  /** 항공 중간값 + 1일 경비 × DEFAULT_NIGHTS */
  totalCost: number | null;
  score: ScoreResult;
  /** 가격 점수 기준: region | all */
  priceBasis: 'region' | 'all' | null;
};

export type DestinationView = Omit<Destination, 'monthly'> & {
  months: MonthView[];
  packages: PackageTour[];
  climateSource: string | null;
};

const dataDir = join(process.cwd(), 'data');

function readDir<T>(sub: string, parse: (x: unknown) => T): Map<string, T> {
  const p = join(dataDir, sub);
  const out = new Map<string, T>();
  if (!existsSync(p)) return out;
  for (const f of readdirSync(p).filter((x) => x.endsWith('.json'))) {
    out.set(f.replace('.json', ''), parse(JSON.parse(readFileSync(join(p, f), 'utf8'))));
  }
  return out;
}

/** 해당 월 항공가. 월별 값이 없으면 연중 대표가로 대체하고 typical=true */
export function flightFor(
  d: Pick<Destination, 'flightPriceTypical'>,
  m: Destination['monthly'][number],
) {
  const monthly = m.flightPrice;
  if (monthly.min !== null && monthly.max !== null) return { ...monthly, typical: false };
  const t = d.flightPriceTypical;
  if (t.min !== null && t.max !== null) return { ...t, typical: true };
  return { ...monthly, typical: false };
}

export function representativeTotal(
  d: Pick<Destination, 'flightPriceTypical'>,
  m: Destination['monthly'][number],
  nights = DEFAULT_NIGHTS,
) {
  const { min, max } = flightFor(d, m);
  const daily = m.dailyCost.total;
  if (min === null || max === null || daily === null) return null;
  return Math.round((min + max) / 2 + daily * nights);
}

let cache: DestinationView[] | null = null;

export function loadDestinations(): DestinationView[] {
  if (cache) return cache;
  const dests = readDir('destinations', (x) => destinationFileSchema.parse(x));
  const climate = readDir('climate', (x) => climateFileSchema.parse(x));
  const packages = readDir('packages', (x) => packageFileSchema.parse(x));

  const flat = [...dests.entries()].flatMap(([region, ds]) => ds.map((d) => ({ d, region })));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  cache = flat.map(({ d, region }) => {
    const c = climate.get(region);
    const rows = c?.cities[d.id];
    const months: MonthView[] = d.monthly
      .slice()
      .sort((a, b) => a.month - b.month)
      .map((m) => {
        const cl = rows?.find((r) => r.month === m.month);
        const totalCost = representativeTotal(d, m);
        const peerTotals = (filter: (x: { d: Destination }) => boolean) =>
          flat
            .filter(filter)
            .map(({ d: o }) =>
              representativeTotal(
                o,
                o.monthly.find((x) => x.month === m.month)!,
              ),
            )
            .filter((v): v is number => v !== null);
        const regionPeers = peerTotals((x) => x.d.region === d.region);
        const usesRegion = regionPeers.length >= MIN_REGION_PEERS;
        const peers = usesRegion ? regionPeers : peerTotals(() => true);
        const regionAvgCost = peers.length >= 2 ? avg(peers) : null;
        const score = computeScore({
          totalCost,
          regionAvgCost,
          avgTempMin: cl?.avgTempMin ?? null,
          avgTempMax: cl?.avgTempMax ?? null,
          rainfallMm: cl?.rainfallMm ?? null,
          themeCount: d.themes.length,
          landmarkCount: d.landmarks.length,
          flightHours: d.flightHours.ICN,
          visaRequired: d.visaInfo.required,
        });
        return {
          ...m,
          flight: flightFor(d, m),
          avgTempMin: cl?.avgTempMin ?? null,
          avgTempMax: cl?.avgTempMax ?? null,
          rainfallMm: cl?.rainfallMm ?? null,
          totalCost,
          score,
          priceBasis: regionAvgCost === null ? null : usesRegion ? 'region' : 'all',
        };
      });
    const { monthly: _monthly, ...rest } = d;
    void _monthly;
    return {
      ...rest,
      months,
      packages: (packages.get(region) ?? []).filter((p) => p.destinationId === d.id),
      climateSource: c ? `${c.source} (${c.years[0]}–${c.years[c.years.length - 1]})` : null,
    };
  });
  return cache;
}
