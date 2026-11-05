import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import {
  WordGuessArchiveSchema,
  type WordGuessCatalogue,
  type WordGuessSnapshot,
} from '@hearth/shared';
export const MAX_WORD_GUESS_BYTES = 1024 * 1024;
// Original, deliberately tiny demo/test data; no downloaded dictionary or NYT answers.
export const DEMO_WORD_GUESS = {
  version: 1 as const,
  answers: ['apple', 'crane', 'sweep', 'plant', 'brush', 'stone'],
  allowedGuesses: [
    'apple',
    'crane',
    'sweep',
    'plant',
    'brush',
    'stone',
    'allee',
    'cigar',
    'racer',
    'arise',
    'stare',
    'lemon',
    'spare',
  ],
};
export function parseWordGuessArchive(input: unknown): WordGuessSnapshot {
  const data = WordGuessArchiveSchema.parse(input);
  return {
    id: 'words_' + createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 24),
    answers: data.answers,
    allowedGuesses: data.allowedGuesses,
  };
}
export class WordGuessArchive {
  private snapshot: WordGuessSnapshot | null = null;
  private status: WordGuessCatalogue['status'] = 'unconfigured';
  private checkedAt = 0;
  private pending: Promise<void> | null = null;
  constructor(
    private readonly path?: string,
    private readonly demo = false,
  ) {
    if (demo && path === undefined) {
      this.snapshot = parseWordGuessArchive(DEMO_WORD_GUESS);
      this.status = 'ready';
    }
  }
  private async load() {
    try {
      if (!isAbsolute(this.path!)) throw new Error('Absolute path required.');
      const file = await open(
        this.path!,
        constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
      );
      try {
        const before = await file.stat();
        if (!before.isFile() || before.size > MAX_WORD_GUESS_BYTES)
          throw new Error('Invalid word file.');
        const bytes = Buffer.alloc(before.size + 1);
        let read = 0;
        while (read < bytes.length) {
          const next = await file.read(bytes, read, bytes.length - read, read);
          if (!next.bytesRead) break;
          read += next.bytesRead;
        }
        const after = await file.stat();
        if (read !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs)
          throw new Error('Word file changed.');
        this.snapshot = parseWordGuessArchive(JSON.parse(bytes.subarray(0, read).toString('utf8')));
        this.status = 'ready';
      } finally {
        await file.close();
      }
    } catch (error) {
      const missing =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
      this.status = this.snapshot ? 'stale' : missing ? 'unconfigured' : 'unavailable';
    }
  }
  async catalogue(): Promise<WordGuessCatalogue> {
    if (
      this.path !== undefined &&
      (this.checkedAt === 0 || Date.now() - this.checkedAt >= 60_000)
    ) {
      this.pending ??= this.load().finally(() => {
        this.checkedAt = Date.now();
        this.pending = null;
      });
      await this.pending;
    }
    return {
      status: this.status,
      source: this.path === undefined && this.demo ? 'original-demo' : 'household-word-list',
      snapshot: this.snapshot,
    };
  }
}
