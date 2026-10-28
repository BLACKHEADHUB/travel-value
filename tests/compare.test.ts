import { describe, expect, it } from 'vitest';
import { freeTripCost, packageStats, pickNights, verdict } from '../src/lib/compare';
import type { PackageTour } from '../src/lib/schema';

const pkg = (o: Partial<PackageTour>): PackageTour => ({
  destinationId: 'x',
  vendor: 'v',
  title: 't',
  nights: 3,
  departureMonth: 5,
  priceKRW: 800_000,
  departureDate: null,
  priceIncludesFuelSurcharge: true,
  included: [],
  excluded: [],
  extraKnownKRW: null,
  hasShopping: null,
  hasOptionalTours: null,
  termsClear: true,
  url: 'https://example.com',
  asOf: '2026-10-28',
  confidence: 'medium',
  ...o,
});

describe('freeTripCost', () => {
  it('flight + daily × nights', () => {
    expect(
      freeTripCost({ flightMin: 300_000, flightMax: 500_000, dailyCost: 100_000, nights: 3 }),
    ).toEqual({ min: 600_000, max: 800_000 });
  });
  it('null when any input unknown or invalid', () => {
    expect(
      freeTripCost({ flightMin: null, flightMax: 500_000, dailyCost: 1, nights: 3 }),
    ).toBeNull();
    expect(freeTripCost({ flightMin: 1, flightMax: 2, dailyCost: null, nights: 3 })).toBeNull();
    expect(freeTripCost({ flightMin: 3, flightMax: 2, dailyCost: 1, nights: 3 })).toBeNull();
    expect(freeTripCost({ flightMin: 1, flightMax: 2, dailyCost: 1, nights: 0 })).toBeNull();
  });
});

describe('packageStats', () => {
  it('min & median of matching clear packages', () => {
    const s = packageStats(
      [pkg({ priceKRW: 700_000 }), pkg({ priceKRW: 900_000 }), pkg({ priceKRW: 1_000_000 })],
      5,
      3,
    );
    expect(s).toMatchObject({
      status: 'ok',
      count: 3,
      min: 700_000,
      median: 900_000,
      extraUnknown: false,
    });
  });
  it('excludes nights mismatch, unclear terms and other months', () => {
    const s = packageStats(
      [pkg({}), pkg({ nights: 4 }), pkg({ termsClear: false }), pkg({ departureMonth: 6 })],
      5,
      3,
    );
    expect(s).toMatchObject({
      status: 'insufficient',
      count: 1,
      excludedNightsMismatch: 1,
      excludedUnclear: 1,
    });
  });
  it('none when nothing matches', () => {
    expect(packageStats([], 5, 3)).toMatchObject({
      status: 'none',
      count: 0,
      min: null,
      median: null,
    });
  });
  it('flags unknown extras (fuel surcharge not included / unpriced exclusions)', () => {
    expect(
      packageStats([pkg({ priceIncludesFuelSurcharge: null }), pkg({})], 5, 3).extraUnknown,
    ).toBe(true);
    expect(packageStats([pkg({ excluded: ['가이드 경비'] }), pkg({})], 5, 3).extraUnknown).toBe(
      true,
    );
    expect(
      packageStats(
        [pkg({ excluded: ['가이드 경비'], extraKnownKRW: 70_000 }), pkg({ extraKnownKRW: 70_000 })],
        5,
        3,
      ),
    ).toMatchObject({ extraUnknown: false, extraKnown: 70_000 });
  });
});

describe('verdict', () => {
  const stats = (min: number, median: number, extraKnown = 0, extraUnknown = false) => ({
    status: 'ok' as const,
    count: 3,
    min,
    median,
    extraKnown,
    extraUnknown,
    excludedNightsMismatch: 0,
    excludedUnclear: 0,
  });
  it('package cheaper → range in 만 원', () => {
    const v = verdict({ min: 1_200_000, max: 1_500_000 }, stats(800_000, 1_000_000));
    expect(v).toMatchObject({ kind: 'package', lowKRW: 200_000, highKRW: 700_000 });
    expect(v.text).toBe('패키지가 약 20~70만 원 저렴할 수 있어요.');
  });
  it('free cheaper', () => {
    const v = verdict({ min: 600_000, max: 700_000 }, stats(900_000, 1_100_000));
    expect(v).toMatchObject({ kind: 'free', lowKRW: 200_000, highKRW: 500_000 });
  });
  it('known extras are added, unknown extras are mentioned', () => {
    const v = verdict({ min: 1_000_000, max: 1_200_000 }, stats(800_000, 900_000, 150_000, true));
    expect(v.kind).toBe('similar');
    expect(v.text).toContain('추가 비용');
  });
  it('overlapping ranges → similar, not a definite claim', () => {
    expect(verdict({ min: 800_000, max: 1_200_000 }, stats(900_000, 1_000_000)).kind).toBe(
      'similar',
    );
  });
  it('withholds judgement with < 2 samples or missing free cost', () => {
    expect(
      verdict({ min: 1, max: 2 }, { ...stats(1, 1), status: 'insufficient', count: 1 }).kind,
    ).toBe('unknown');
    expect(verdict(null, stats(1, 1)).kind).toBe('unknown');
  });
});

describe('pickNights', () => {
  it('most common nights, shorter on tie, fallback when empty', () => {
    expect(pickNights([{ nights: 3 }, { nights: 3 }, { nights: 4 }], 4)).toBe(3);
    expect(pickNights([{ nights: 5 }, { nights: 4 }], 3)).toBe(4);
    expect(pickNights([], 4)).toBe(4);
  });
});
