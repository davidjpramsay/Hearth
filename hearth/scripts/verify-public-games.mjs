import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

function hasPuzzle(value) {
  if (Array.isArray(value)) return value.some(hasPuzzle);
  if (!value || typeof value !== 'object') return false;
  return (
    'starting_board' in value ||
    (Array.isArray(value.answers) && Array.isArray(value.allowedGuesses)) ||
    ('groups' in value && ('board' in value || 'puzzle_number' in value)) ||
    Object.values(value).some(hasPuzzle)
  );
}
export function isPrivatePuzzleFile(name, content) {
  if (/^hearth\/content\/(?:connections|word-guess)\//.test(name))
    return !/^hearth\/content\/(?:connections|word-guess)\/README\.md$/.test(name);
  if (
    /(?:^|\/)(?:connections|nyt-connections[^/]*|word-guess|wordle[^/]*)\.(?:json|jsonl|csv|zip|gz|tar|tgz)$/i.test(
      name,
    )
  )
    return true;
  // Inspect JSON data even if renamed to .txt; source code and original TS demo fixtures are not archives.
  const text = content.toString('utf8').trim();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (
    lines.length >= 30 &&
    lines.filter((line) => /^[a-z]{5}$/.test(line)).length / lines.length > 0.9
  )
    return true;
  if (!['[', '{'].includes(text[0])) return false;
  try {
    return hasPuzzle(JSON.parse(text));
  } catch {
    if (/\.jsonl$/i.test(name))
      return text.split('\n').some((line) => {
        try {
          return hasPuzzle(JSON.parse(line));
        } catch {
          return false;
        }
      });
    return false; // Other validation owns malformed configuration/source syntax.
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const rejected = files.filter((name) =>
    isPrivatePuzzleFile(name, readFileSync(resolve(root, name))),
  );
  if (rejected.length)
    throw new Error(`Private puzzle archives must not be published: ${rejected.join(', ')}`);
  console.log(
    `PASS: ${files.length} source files checked; no distributed puzzle archive. Original TypeScript demo fixtures remain separate.`,
  );
}
