import { mkdtemp, writeFile, rm, symlink, mkdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_WORD_GUESS,
  MAX_WORD_GUESS_BYTES,
  parseWordGuessArchive,
  WordGuessArchive,
} from './word-guess-archive.js';
const dirs: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
async function location() {
  const dir = await mkdtemp(join(tmpdir(), 'hearth-words-'));
  dirs.push(dir);
  return join(dir, 'words.json');
}
describe('private word list reader', () => {
  it('ships only an original demo and no private fallback dictionary', async () => {
    expect((await new WordGuessArchive(undefined, true).catalogue()).source).toBe('original-demo');
    expect((await new WordGuessArchive().catalogue()).snapshot).toBeNull();
    expect((await new WordGuessArchive('/missing/hearth/words.json').catalogue()).status).toBe(
      'unconfigured',
    );
  });
  it('loads validated files, retains the last good snapshot on errors and picks up atomic replacement', async () => {
    const path = await location();
    await writeFile(path, JSON.stringify(DEMO_WORD_GUESS));
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const store = new WordGuessArchive(path);
    const first = await store.catalogue();
    expect(first.status).toBe('ready');
    await writeFile(path, 'broken');
    now += 61000;
    expect(await store.catalogue()).toEqual({ ...first, status: 'stale' });
    const replacement = { ...DEMO_WORD_GUESS, answers: ['crane'] };
    await writeFile(path + '.new', JSON.stringify(replacement));
    await rename(path + '.new', path);
    now += 61000;
    const next = await store.catalogue();
    expect(next.status).toBe('ready');
    expect(next.snapshot!.id).not.toBe(first.snapshot!.id);
  });
  it('rejects oversized, invalid, relative, directory and symlink inputs without returning their contents', async () => {
    const path = await location();
    await writeFile(path, 'x'.repeat(MAX_WORD_GUESS_BYTES + 1));
    expect((await new WordGuessArchive(path).catalogue()).status).toBe('unavailable');
    await writeFile(path, JSON.stringify({ ...DEMO_WORD_GUESS, answers: ['wrongword'] }));
    expect((await new WordGuessArchive(path).catalogue()).snapshot).toBeNull();
    expect((await new WordGuessArchive('relative.json').catalogue()).status).toBe('unavailable');
    const link = path + '.link';
    await symlink(path, link);
    expect((await new WordGuessArchive(link).catalogue()).snapshot).toBeNull();
    await mkdir(path + '.dir');
    expect((await new WordGuessArchive(path + '.dir').catalogue()).snapshot).toBeNull();
    expect(() => parseWordGuessArchive({})).toThrow();
  });
});
