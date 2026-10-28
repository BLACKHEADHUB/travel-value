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
import { flightFor, MAX_NIGHTS, MIN_NIGHTS, tripTotal, type PeerStats } from './trip';
import { SCORE_PARAMS } from './score';

export { DEFAULT_NIGHTS, flightFor } from './trip';

export type MonthView = Destination['monthly'][number] & {
  avgTempMin: number | null;
  avgTempMax: number | null;
  rainfallMm: number | null;
  /** 실제 표시용 항공가 (월별 없으면 연중 대표가, typical=true) */
  flight: ReturnType<typeof flightFor>;
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

let cache: DestinationView[] | null = null;

export function loadDestinations(): DestinationView[] {
  if (cache) return cache;
  const dests = readDir('destinations', (x) => destinationFileSchema.parse(x));
  const climate = readDir('climate', (x) => climateFileSchema.parse(x));
  const packages = readDir('packages', (x) => packageFileSchema.parse(x));

  cache = [...dests.entries()].flatMap(([region, ds]) =>
    ds.map((d) => {
      const c = climate.get(region);
      const rows = c?.cities[d.id];
      const months: MonthView[] = d.monthly
        .slice()
        .sort((a, b) => a.month - b.month)
        .map((m) => {
          const cl = rows?.find((r) => r.month === m.month);
          return {
            ...m,
            flight: flightFor(d, m),
            avgTempMin: cl?.avgTempMin ?? null,
            avgTempMax: cl?.avgTempMax ?? null,
            rainfallMm: cl?.rainfallMm ?? null,
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
    }),
  );
  return cache;
}

/** 월·박수별 가격 비교 평균 (지역은 비교 도시가 minRegionPeers 이상일 때만) */
export function loadPeerStats(): PeerStats {
  const all = loadDestinations();
  const avg = (xs: number[]) =>
    xs.length >= 2 ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  const out: PeerStats = {};
  for (let month = 1; month <= 12; month++) {
    out[month] = {};
    for (let n = MIN_NIGHTS; n <= MAX_NIGHTS; n++) {
      const totals = all
        .map((d) => ({
          region: d.region as string,
          t: tripTotal(d.months[month - 1].flight, d.months[month - 1].dailyCost.total, n),
        }))
        .filter((x): x is { region: string; t: number } => x.t !== null);
      const region: Record<string, number | null> = {};
      for (const r of new Set(totals.map((x) => x.region))) {
        const xs = totals.filter((x) => x.region === r).map((x) => x.t);
        region[r] = xs.length >= SCORE_PARAMS.minRegionPeers ? avg(xs) : null;
      }
      out[month][n] = { all: avg(totals.map((x) => x.t)), region };
    }
  }
  return out;
}
