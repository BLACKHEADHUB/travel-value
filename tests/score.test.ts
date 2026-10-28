import { describe, expect, it } from 'vitest';
import {
  SCORE_WEIGHTS,
  scorePoints,
  travelBurden,
  accessScore,
  climateScore,
  computeScore,
  priceScore,
  themeScore,
  type ScoreInput,
} from '../src/lib/score';

const full: ScoreInput = {
  totalCost: 1_000_000,
  regionAvgCost: 1_000_000,
  avgTempMin: 18,
  avgTempMax: 26,
  rainfallMm: 50,
  themeCount: 4,
  flightHours: 3,
  visaKind: 'free',
  nights: 4,
  comfortMin: 18,
  comfortMax: 27,
  rainAvoid: false,
};

describe('weights', () => {
  it('sum to 1', () => {
    expect(Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe('priceScore', () => {
  it('boundary ratios', () => {
    expect(priceScore(600, 1000)).toBe(100);
    expect(priceScore(500, 1000)).toBe(100);
    expect(priceScore(1600, 1000)).toBe(0);
    expect(priceScore(2000, 1000)).toBe(0);
    expect(priceScore(1000, 1000)).toBeCloseTo(60);
  });
  it('null / invalid → null', () => {
    expect(priceScore(null, 1000)).toBeNull();
    expect(priceScore(1000, null)).toBeNull();
    expect(priceScore(1000, 0)).toBeNull();
  });
});

describe('climateScore', () => {
  it('comfort range = 100, edges included', () => {
    expect(climateScore(14, 22, 0)).toBe(100); // mean 18
    expect(climateScore(22, 32, 0)).toBe(100); // mean 27
  });
  it('penalises heat, cold and rain, clamped at 0', () => {
    expect(climateScore(26, 34, 0)).toBe(100 - 3 * 6); // mean 30
    expect(climateScore(-10, 0, 0)).toBe(0);
    expect(climateScore(18, 26, 300)).toBe(60); // rain penalty capped at 40
  });
  it('null temp → null, null rain → ignored', () => {
    expect(climateScore(null, 20, 0)).toBeNull();
    expect(climateScore(18, 26, null)).toBe(100);
  });
});

describe('theme / access', () => {
  it('theme caps and null', () => {
    expect(themeScore(8)).toBe(100);
    expect(themeScore(2)).toBe(50);
    expect(themeScore(null)).toBeNull();
  });
  it('access combines travel burden and graded visa', () => {
    expect(accessScore(3, 'free')).toBe(100); // 왕복 6h / 120h = 5%
    // 왕복 28h / 120h ≈ 23.3% → 비행 8.3점, 비자 0점
    expect(accessScore(14, 'visa')).toBeCloseTo(((0.25 - 28 / 120) / 0.2) * 100 * 0.8);
    expect(accessScore(null, 'visa')).toBe(0);
    expect(accessScore(null, 'eta')).toBe(70);
    expect(accessScore(3, 'eta')).toBeCloseTo(100 * 0.8 + 70 * 0.2);
    expect(accessScore(3, null)).toBe(100);
    expect(accessScore(null, null)).toBeNull();
  });
});

describe('computeScore', () => {
  it('full input', () => {
    const r = computeScore(full);
    expect(r.total).toBe(Math.round(60 * 0.4 + 100 * 0.3 + 100 * 0.2 + 100 * 0.1));
  });
  it('redistributes weights when price is null', () => {
    const r = computeScore({ ...full, totalCost: null });
    expect(r.parts.price).toBeNull();
    expect(r.weights.price).toBe(0);
    expect(r.weights.climate).toBeCloseTo(0.5);
    expect(r.total).toBe(100);
  });
  it('all null → total null', () => {
    const r = computeScore({
      totalCost: null,
      regionAvgCost: null,
      avgTempMin: null,
      avgTempMax: null,
      rainfallMm: null,
      themeCount: null,
      flightHours: null,
      visaKind: null,
      nights: 4,
      comfortMin: 18,
      comfortMax: 27,
      rainAvoid: false,
    });
    expect(r.total).toBeNull();
  });
  it('stays within 0..100', () => {
    const r = computeScore({
      ...full,
      totalCost: 99_000_000,
      avgTempMin: -30,
      avgTempMax: -20,
      flightHours: 30,
      visaKind: 'visa',
      themeCount: 0,
    });
    expect(r.total).toBe(0);
  });
});

describe('user preferences', () => {
  it('long stays reduce long-haul burden', () => {
    expect(travelBurden(14, 4)).toBeCloseTo(28 / 120);
    expect(accessScore(14, 'free', 4)).toBeLessThan(accessScore(14, 'free', 13)!);
    expect(accessScore(14, 'free', 13)).toBeGreaterThan(70);
  });
  it('comfort range follows the user', () => {
    const cool = { comfortMin: 5, comfortMax: 15, rainAvoid: false };
    expect(climateScore(5, 15, 0, cool)).toBe(100); // 평균 10℃
    expect(climateScore(25, 35, 0, cool)).toBe(10); // 평균 30℃ → 15℃ 초과 × 6점
    expect(climateScore(30, 40, 0, cool)).toBe(0); // 평균 35℃ → 하한 0
    expect(climateScore(18, 26, 0)).toBe(100); // 기본 18~27
  });
  it('rain avoidance doubles the rain penalty', () => {
    const base = { comfortMin: 18, comfortMax: 27, rainAvoid: false };
    expect(climateScore(18, 26, 200, base)).toBe(75);
    expect(climateScore(18, 26, 200, { ...base, rainAvoid: true })).toBe(50);
  });
  it('points add up to the total (within rounding)', () => {
    const r = computeScore(full);
    const pts = scorePoints(r);
    expect(pts.reduce((a, p) => a + p.max, 0)).toBe(100);
    expect(Math.abs(pts.reduce((a, p) => a + (p.got ?? 0), 0) - r.total!)).toBeLessThanOrEqual(2);
  });
  it('excluded part has null points and redistributed max', () => {
    const pts = scorePoints(computeScore({ ...full, totalCost: null }));
    expect(pts.find((p) => p.key === 'price')).toEqual({ key: 'price', got: null, max: 0 });
    expect(pts.find((p) => p.key === 'climate')!.max).toBe(50);
  });
});
