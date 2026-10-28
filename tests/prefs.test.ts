import { describe, expect, it } from 'vitest';
import { parsePrefs, prefsQuery, returnDate, validDate, whenLabel } from '../src/lib/prefs';
import { monthsLabel } from '../src/lib/format';

const q = (s: string) => new URLSearchParams(s);
const now = new Date(2026, 9, 28); // 10월

describe('parsePrefs', () => {
  it('defaults', () => {
    expect(parsePrefs(q(''), now)).toEqual({
      month: 10,
      nights: 4,
      date: null,
      tMin: 18,
      tMax: 27,
      rainAvoid: false,
    });
  });
  it('clamps and validates', () => {
    const p = parsePrefs(q('m=13&n=40&t=50~-30&rain=avoid'), now);
    expect(p).toEqual({ month: 10, nights: 13, date: null, tMin: -10, tMax: 35, rainAvoid: true });
    expect(parsePrefs(q('m=0.5&n=0'), now)).toMatchObject({ month: 10, nights: 1 });
  });
  it('round-trips and omits defaults', () => {
    expect(prefsQuery(parsePrefs(q('m=7'), now))).toBe('m=7');
    const p = parsePrefs(q('m=7&n=9&t=10~20&rain=avoid'), now);
    expect(parsePrefs(q(prefsQuery(p)), now)).toEqual(p);
  });
});

describe('departure date', () => {
  it('date sets the month and round-trips', () => {
    const p = parsePrefs(q('m=3&d=2026-11-14&n=4'), now);
    expect(p).toMatchObject({ month: 11, date: '2026-11-14', nights: 4 });
    expect(parsePrefs(q(prefsQuery(p)), now)).toEqual(p);
  });
  it('rejects invalid dates', () => {
    expect(validDate('2026-02-30')).toBeNull();
    expect(validDate('2026-13-01')).toBeNull();
    expect(validDate('26-1-1')).toBeNull();
    expect(parsePrefs(q('d=2026-02-30&m=5'), now)).toMatchObject({ month: 5, date: null });
  });
  it('labels', () => {
    expect(returnDate('2026-11-28', 4)).toBe('2026-12-02');
    expect(whenLabel(parsePrefs(q('d=2026-11-14&n=4'), now))).toBe('11월 14일(토) → 18일(수)');
    expect(whenLabel(parsePrefs(q('d=2026-11-28&n=4'), now))).toBe('11월 28일(토) → 12월 2일(수)');
    expect(whenLabel(parsePrefs(q('m=7'), now))).toBe('7월 중');
  });
});

describe('monthsLabel', () => {
  it('compresses runs, wrapping year end', () => {
    expect(monthsLabel([1, 2, 11, 12])).toBe('11~2월');
    expect(monthsLabel([3, 5])).toBe('3·5월');
    expect(monthsLabel([4, 5, 6, 10])).toBe('4~6·10월');
    expect(monthsLabel([7])).toBe('7월');
    expect(monthsLabel([])).toBe('정보 없음');
  });
});
