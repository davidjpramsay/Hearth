import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { isPrivatePuzzleFile } from './verify-public-games.mjs';

test('only the README can be published in the content placeholder', () => {
  assert.equal(
    isPrivatePuzzleFile('hearth/content/connections/README.md', '# Private setup'),
    false,
  );
  assert.equal(isPrivatePuzzleFile('hearth/content/connections/download.txt', 'text'), true);
});
test('known archive names cannot bypass the guard using compression or different case', () => {
  for (const name of ['private/connections.json', 'NYT-CONNECTIONS-archive.ZIP', 'connections.csv'])
    assert.equal(isPrivatePuzzleFile(name, ''), true);
});
test('archive-shaped JSON is rejected when nested, renamed or line-delimited', () => {
  const originalFixture = { starting_board: [['ORIGINAL', 'FIXTURE']] };
  for (const value of [originalFixture, [originalFixture], { data: { games: [originalFixture] } }])
    assert.equal(isPrivatePuzzleFile('innocent.txt', JSON.stringify(value)), true);
  assert.equal(isPrivatePuzzleFile('data.jsonl', `{}\n${JSON.stringify(originalFixture)}`), true);
  assert.equal(isPrivatePuzzleFile('data.json', '{"board":[],"groups":[]}'), true);
});
test('ordinary configuration and original TypeScript demos are allowed', () => {
  assert.equal(isPrivatePuzzleFile('config.json', '{"games":{"connections":true}}'), false);
  assert.equal(
    isPrivatePuzzleFile('demo.ts', 'export const demo = { groups: [], board: [] };'),
    false,
  );
  assert.equal(isPrivatePuzzleFile('script.sh', '#!/bin/sh\ntrue'), false);
});

test('downloaded word databases stay private even if renamed', () => {
  assert.equal(isPrivatePuzzleFile('hearth/content/word-guess/README.md', '# Setup'), false);
  assert.equal(isPrivatePuzzleFile('hearth/content/word-guess/answers.txt', 'words'), true);
  assert.equal(isPrivatePuzzleFile('Wordle-answers.zip', ''), true);
  assert.equal(
    isPrivatePuzzleFile(
      'innocent.txt',
      JSON.stringify({ version: 1, answers: ['apple'], allowedGuesses: ['apple'] }),
    ),
    true,
  );
  assert.equal(
    isPrivatePuzzleFile('notes.txt', Array.from({ length: 40 }, () => 'apple').join('\n')),
    true,
  );
});

test('private word preparation validates files, creates protected output, and never overwrites source/data', async () => {
  const { mkdtemp, writeFile, readFile, stat, rm, access } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const root = await mkdtemp(join(tmpdir(), 'hearth-import-'));
  const answers = join(root, 'answers.txt'),
    guesses = join(root, 'guesses.txt'),
    output = join(root, 'words.json');
  try {
    await writeFile(answers, 'apple\ncrane\napple\n');
    await writeFile(guesses, 'crane\napple\n');
    const script = new URL('./prepare-word-guess.py', import.meta.url);
    const run = (target = output) =>
      spawnSync(
        'python3',
        [fileURLToPath(script), '--answers', answers, '--guesses', guesses, '--output', target],
        { encoding: 'utf8' },
      );
    assert.equal(run().status, 0);
    assert.equal((await stat(output)).mode & 0o777, 0o600);
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), {
      version: 1,
      answers: ['apple', 'crane'],
      allowedGuesses: ['apple', 'crane'],
    });
    assert.notEqual(run().status, 0);
    await writeFile(answers, 'APPLE\n');
    assert.notEqual(run(join(root, 'invalid.json')).status, 0);
    const repoTarget = fileURLToPath(
      new URL('../word-guess-must-not-be-created.json', import.meta.url),
    );
    assert.notEqual(run(repoTarget).status, 0);
    await assert.rejects(access(repoTarget));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
