import type { WordGuessSnapshot } from '@hearth/shared';
export type WordGuessMark = 'exact' | 'present' | 'absent';
export type WordGuessRound = {
  snapshotId: string;
  index: number;
  guesses: string[];
  draft: string;
};
export function scoreWordGuess(answer: string, guess: string): WordGuessMark[] {
  if (!/^[a-z]{5}$/.test(answer) || !/^[a-z]{5}$/.test(guess)) throw new Error('Use five letters.');
  const marks: WordGuessMark[] = Array.from({ length: 5 }, () => 'absent');
  const remaining = new Map<string, number>();
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) marks[i] = 'exact';
    else remaining.set(answer[i]!, (remaining.get(answer[i]!) ?? 0) + 1);
  }
  for (let i = 0; i < 5; i++) {
    if (marks[i] === 'exact') continue;
    const n = remaining.get(guess[i]!) ?? 0;
    if (n) {
      marks[i] = 'present';
      remaining.set(guess[i]!, n - 1);
    }
  }
  return marks;
}
export function wordGuessStatus(
  answer: string,
  guesses: readonly string[],
): 'playing' | 'won' | 'lost' {
  return guesses.includes(answer) ? 'won' : guesses.length >= 6 ? 'lost' : 'playing';
}
export function appendWordGuess(
  answer: string,
  guesses: readonly string[],
  guess: string,
  allowed: ReadonlySet<string>,
): string[] {
  if (wordGuessStatus(answer, guesses) !== 'playing') throw new Error('This word is finished.');
  if (!/^[a-z]{5}$/.test(guess)) throw new Error('Enter five letters.');
  if (!allowed.has(guess)) throw new Error('That word is not in this word list.');
  if (guesses.includes(guess)) throw new Error('You already tried that word.');
  return [...guesses, guess];
}
export function newWordGuessRound(snapshot: WordGuessSnapshot, index = 0): WordGuessRound {
  return {
    snapshotId: snapshot.id,
    index: index % snapshot.answers.length,
    guesses: [],
    draft: '',
  };
}
export function restoreWordGuessRound(
  input: unknown,
  snapshot: WordGuessSnapshot,
): WordGuessRound | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const data = input as Partial<WordGuessRound>;
  if (
    data.snapshotId !== snapshot.id ||
    !Number.isInteger(data.index) ||
    data.index! < 0 ||
    data.index! >= snapshot.answers.length ||
    !Array.isArray(data.guesses) ||
    data.guesses.length > 6 ||
    typeof data.draft !== 'string' ||
    !/^[a-z]{0,5}$/.test(data.draft)
  )
    return null;
  let guesses: string[] = [];
  try {
    const allowed = new Set(snapshot.allowedGuesses);
    for (const guess of data.guesses)
      guesses = appendWordGuess(snapshot.answers[data.index!]!, guesses, guess, allowed);
    if (wordGuessStatus(snapshot.answers[data.index!]!, guesses) !== 'playing' && data.draft !== '')
      return null;
  } catch {
    return null;
  }
  return { snapshotId: snapshot.id, index: data.index!, guesses, draft: data.draft };
}
