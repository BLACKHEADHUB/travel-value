import { describe, expect, it } from 'vitest';
import { SCORE_WEIGHTS } from '../src/lib/score';

describe('score weights', () => {
  it('sum to 1', () => {
    const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});
