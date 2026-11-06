import { expect, it } from 'vitest';
import { fitRoutinePages } from './routinePagination';

it('shows all tasks when they fit, without reserving an unnecessary pager', () => {
  expect(fitRoutinePages(Array(9).fill(56), 536, 4, 48, 8)).toEqual([{ start: 0, end: 9 }]);
  expect(fitRoutinePages(Array(7).fill(56), 416, 4, 48, 8)).toEqual([{ start: 0, end: 7 }]);
});
it('uses every available row before paging and reserves real pager space', () => {
  expect(fitRoutinePages(Array(12).fill(56), 536, 4, 48, 8)).toEqual([
    { start: 0, end: 8 },
    { start: 8, end: 12 },
  ]);
});
it('budgets wrapped rows individually rather than penalizing every row for one long title', () => {
  expect(fitRoutinePages([100, 56, 56, 56, 56, 100], 400, 4, 48, 8)).toEqual([
    { start: 0, end: 5 },
    { start: 5, end: 6 },
  ]);
});
it('gains rows when a verse or feedback is removed and loses rows when height shrinks', () => {
  const heights = Array(9).fill(56);
  expect(fitRoutinePages(heights, 536, 4, 48, 8)).toHaveLength(1);
  expect(fitRoutinePages(heights, 440, 4, 48, 8)[0]).toEqual({ start: 0, end: 6 });
});
it('keeps every task exactly once with fractional geometry', () => {
  const heights = [56.25, 84.5, 56.25, 56.25, 100.1, 56.25, 80.2, 56.25, 56.25];
  const pages = fitRoutinePages(heights, 365.5, 7.5, 48.2, 8.1);
  expect(pages.flatMap(({ start, end }) => heights.slice(start, end))).toEqual(heights);
  for (const { start, end } of pages) {
    const size = heights.slice(start, end).reduce((a, b) => a + b, 0) + (end - start - 1) * 7.5;
    expect(size).toBeLessThanOrEqual(365.5 - 48.2 - 8.1 + 0.5);
    if (end < heights.length)
      expect(size + 7.5 + heights[end]!).toBeGreaterThan(365.5 - 48.2 - 8.1 + 0.5);
  }
});
it('keeps empty and unusually small layouts finite', () => {
  expect(fitRoutinePages([], 300, 8, 48, 8)).toEqual([{ start: 0, end: 0 }]);
  expect(fitRoutinePages([120, 120], 80, 8, 48, 8)).toEqual([
    { start: 0, end: 1 },
    { start: 1, end: 2 },
  ]);
});
