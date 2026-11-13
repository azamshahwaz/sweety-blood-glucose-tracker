import { formatDate, formatMonth, formatShortDate, getGreeting, todayLocal } from '../utils/date';

describe('date utils', () => {
  test('formats dates without timezone shifts', () => {
    expect(formatDate('2026-10-01')).toBe('1 Oct 2026');
    expect(formatDate('2026-12-31')).toBe('31 Dec 2026');
    expect(formatShortDate('2026-01-05')).toBe('5 Jan');
    expect(formatMonth('2026-10')).toBe('Oct 2026');
  });
  test('greets by time of day', () => {
    expect(getGreeting(new Date(2026, 0, 1, 9))).toBe('Good morning');
    expect(getGreeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon');
    expect(getGreeting(new Date(2026, 0, 1, 20))).toBe('Good evening');
  });
  test('todayLocal returns YYYY-MM-DD', () => expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/));
});
