import { describe, expect, it } from 'vitest';
import { parsePrefs, prefsQuery } from '../src/lib/prefs';

const q = (s: string) => new URLSearchParams(s);
const now = new Date(2026, 9, 28); // 10월

describe('parsePrefs', () => {
  it('defaults', () => {
    expect(parsePrefs(q(''), now)).toEqual({
      month: 10,
      nights: 4,
      tMin: 18,
      tMax: 27,
      rainAvoid: false,
    });
  });
  it('clamps and validates', () => {
    const p = parsePrefs(q('m=13&n=40&t=50~-30&rain=avoid'), now);
    expect(p).toEqual({ month: 10, nights: 13, tMin: -10, tMax: 35, rainAvoid: true });
    expect(parsePrefs(q('m=0.5&n=0'), now)).toMatchObject({ month: 10, nights: 1 });
  });
  it('round-trips and omits defaults', () => {
    expect(prefsQuery(parsePrefs(q('m=7'), now))).toBe('m=7');
    const p = parsePrefs(q('m=7&n=9&t=10~20&rain=avoid'), now);
    expect(parsePrefs(q(prefsQuery(p)), now)).toEqual(p);
  });
});
