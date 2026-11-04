import assert from 'node:assert/strict';
import { test } from 'node:test';
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
