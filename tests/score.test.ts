import { describe, expect, it } from 'vitest';
import {
  SCORE_WEIGHTS,
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
  landmarkCount: 5,
  flightHours: 3,
  visaRequired: false,
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
  it('theme caps and partial nulls', () => {
    expect(themeScore(8, 10)).toBe(100);
    expect(themeScore(2, null)).toBe(50);
    expect(themeScore(null, null)).toBeNull();
  });
  it('access combines flight and visa', () => {
    expect(accessScore(3, false)).toBe(100);
    expect(accessScore(14, true)).toBe(0);
    expect(accessScore(null, true)).toBe(0);
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
      landmarkCount: null,
      flightHours: null,
      visaRequired: null,
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
      visaRequired: true,
      themeCount: 0,
      landmarkCount: 0,
    });
    expect(r.total).toBe(0);
  });
});
