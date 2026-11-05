import { describe, expect, it } from 'vitest';
import {
  appendWordGuess,
  newWordGuessRound,
  restoreWordGuessRound,
  scoreWordGuess,
  wordGuessStatus,
} from './word-guess.js';
const snapshot = {
  id: 'words_fixture',
  answers: ['apple', 'crane'],
  allowedGuesses: [
    'apple',
    'crane',
    'sweep',
    'plant',
    'brush',
    'stone',
    'lemon',
    'allee',
    'cacao',
    'civic',
  ],
};
describe('five-letter word rounds', () => {
  it.each([
    ['apple', 'allee', ['exact', 'present', 'absent', 'absent', 'exact']],
    ['civic', 'cacao', ['exact', 'absent', 'present', 'absent', 'absent']],
    ['apple', 'apple', ['exact', 'exact', 'exact', 'exact', 'exact']],
    ['brush', 'civic', ['absent', 'absent', 'absent', 'absent', 'absent']],
  ])('scores repeated letters once: %s / %s', (answer, guess, marks) =>
    expect(scoreWordGuess(answer as string, guess as string)).toEqual(marks),
  );
  it('does not spend attempts for incomplete, unknown or duplicate guesses', () => {
    const allowed = new Set(snapshot.allowedGuesses);
    for (const word of ['app', 'ápple', 'APPLE', 'zzzzz'])
      expect(() => appendWordGuess('apple', [], word, allowed)).toThrow();
    expect(() => appendWordGuess('apple', ['crane'], 'crane', allowed)).toThrow('already');
    expect(appendWordGuess('apple', [], 'crane', allowed)).toEqual(['crane']);
  });
  it('finishes a win or six misses and cannot accept later guesses', () => {
    expect(wordGuessStatus('apple', ['apple'])).toBe('won');
    const misses = ['crane', 'sweep', 'plant', 'brush', 'stone', 'lemon'];
    expect(wordGuessStatus('apple', misses)).toBe('lost');
    expect(() =>
      appendWordGuess('apple', misses, 'apple', new Set(snapshot.allowedGuesses)),
    ).toThrow('finished');
  });
  it('restores only valid progress for this snapshot and word, with no post-win turns', () => {
    const round = { ...newWordGuessRound(snapshot), guesses: ['crane'], draft: 'app' };
    expect(restoreWordGuessRound(round, snapshot)).toEqual(round);
    for (const change of [
      { snapshotId: 'changed' },
      { index: -1 },
      { index: 99 },
      { index: 0.2 },
      { draft: 'too long' },
      { guesses: ['zzzzz'] },
      { guesses: ['apple', 'crane'], draft: '' },
      { guesses: ['crane', 'crane'] },
      { guesses: ['apple'], draft: 'a' },
    ])
      expect(restoreWordGuessRound({ ...round, ...change }, snapshot)).toBeNull();
    expect(restoreWordGuessRound(null, snapshot)).toBeNull();
    expect(newWordGuessRound(snapshot, 2).index).toBe(0);
  });
});
