import { describe, expect, it } from 'vitest';
import {
  connectFourBoard,
  connectFourLanding,
  dropConnectFour,
  newConnectFourRound,
  restoreConnectFour,
} from './connect-four.js';

describe('Connect Four local round', () => {
  it('uses gravity, alternates players and never mutates the prior round', () => {
    const first = newConnectFourRound();
    const second = dropConnectFour(first, 3);
    const third = dropConnectFour(second, 3);
    expect(first.moves).toEqual([]);
    expect(connectFourBoard(third).cells[38]).toBe(1);
    expect(connectFourBoard(third).cells[31]).toBe(2);
    expect(connectFourBoard(third).player).toBe(1);
    expect(connectFourLanding(connectFourBoard(third), 3)).toBe(24);
  });
  for (const [name, moves] of [
    ['horizontal', [0, 6, 1, 6, 2, 5, 3]],
    ['vertical', [0, 1, 0, 1, 0, 2, 0]],
    ['rising diagonal', [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3]],
    ['falling diagonal', [6, 5, 5, 4, 2, 4, 4, 3, 2, 3, 1, 3, 3]],
  ] as const)
    it(`detects a ${name} win and disallows further play`, () => {
      const round = { firstPlayer: 1 as const, moves: [...moves] };
      expect(connectFourBoard(round).winner).toBe(1);
      expect(connectFourBoard(round).winningCells).toHaveLength(4);
      expect(() => dropConnectFour(round, 0)).toThrow('finished');
      expect(restoreConnectFour({ ...round, moves: [...moves, 0] })).toBeNull();
    });
  it('recognises a full-board draw without a winner', () => {
    const round = {
      firstPlayer: 1 as const,
      moves: [
        4, 2, 4, 4, 4, 5, 6, 3, 0, 1, 3, 0, 5, 4, 5, 2, 1, 1, 0, 2, 2, 6, 6, 1, 6, 4, 2, 2, 0, 6, 0,
        6, 5, 1, 3, 0, 1, 5, 5, 3, 3, 3,
      ],
    };
    expect(connectFourBoard(round).draw).toBe(true);
    expect(connectFourBoard(round).winner).toBeNull();
    expect(() => dropConnectFour(round, 1)).toThrow('finished');
  });
  it('rejects full columns, fractional/out-of-range columns and invalid restored histories', () => {
    const full = { firstPlayer: 2 as const, moves: [0, 0, 0, 0, 0, 0] };
    expect(connectFourLanding(connectFourBoard(full), 0)).toBeNull();
    for (const column of [0, -1, 7, 0.5, NaN])
      expect(() => dropConnectFour(full, column)).toThrow();
    for (const value of [
      null,
      {},
      { firstPlayer: 3, moves: [] },
      { firstPlayer: 1, moves: ['0'] },
      { firstPlayer: 1, moves: Array(43).fill(0) },
      { ...full, moves: [...full.moves, 0] },
    ])
      expect(restoreConnectFour(value)).toBeNull();
    expect(restoreConnectFour(full)).toEqual(full);
  });
});
