import { describe, expect, it } from 'vitest';
import { WordGuessArchiveSchema } from './word-guess.js';
import { GameModuleFlagsSchema, gameModuleForPath } from './game-modules.js';
const data = { version: 1, answers: ['apple'], allowedGuesses: ['apple', 'crane'] };
describe('private word-list protocol', () => {
  it('accepts bounded ASCII lists and rejects duplicates, missing answers and extra content', () => {
    expect(WordGuessArchiveSchema.parse(data)).toEqual(data);
    for (const change of [
      { version: 2 },
      { answers: [] },
      { answers: ['APPLE'] },
      { answers: ['apple', 'apple'] },
      { allowedGuesses: ['crane'] },
      { allowedGuesses: ['apple', 'apple'] },
      { url: 'https://invalid.example/words' },
      { answers: Array.from({ length: 10001 }, () => 'apple') },
      { allowedGuesses: Array.from({ length: 30001 }, () => 'apple') },
    ])
      expect(WordGuessArchiveSchema.safeParse({ ...data, ...change }).success).toBe(false);
  });
  it('reads old response receipts without changing their stored shape and guards the new route', () => {
    const old = { connections: false, connectFour: true };
    expect(GameModuleFlagsSchema.parse(old)).toEqual({ ...old, wordGuess: true });
    expect(old).toEqual({ connections: false, connectFour: true });
    expect(gameModuleForPath('/games/word-guess')).toBe('wordGuess');
  });
});
