import assert from 'node:assert/strict';
import { cp, lstat, mkdir, readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../site/', import.meta.url));
const published = [
  'index.html',
  'site.css',
  'site.js',
  'assets/hearth-mark.png',
  'assets/today-demo.jpg',
  'assets/calendar-demo.jpg',
  'assets/morning-demo.jpg',
  'assets/fitness-demo.jpg',
  'assets/source-sans-3-latin.woff2',
  'assets/OFL.txt',
];
const permitted = new Set([...published, 'ASSETS.md']);
async function walk(directory, prefix = '') {
  const paths = [];
  for (const name of await readdir(directory)) {
    const relative = `${prefix}${name}`;
    const stat = await lstat(join(directory, name));
    assert(!stat.isSymbolicLink(), `No symlinks in public site: ${relative}`);
    if (stat.isDirectory()) paths.push(...(await walk(join(directory, name), `${relative}/`)));
    else paths.push(relative);
  }
  return paths;
}
const files = await walk(source);
assert.deepEqual([...files].sort(), [...permitted].sort(), 'Public site file allowlist changed');
let total = 0;
for (const file of files) {
  const path = join(source, file);
  total += (await lstat(path)).size;
  if (!/\.(html|css|js|md|txt)$/.test(file)) continue;
  const content = await readFile(path, 'utf8');
  assert(
    !/ramsay-nas|192\.168\.|100\.\d+\.\d+\.\d+|-----BEGIN .*PRIVATE KEY|gh[pousr]_[a-zA-Z0-9]{20}/i.test(
      content,
    ),
    `Private material in ${file}`,
  );
}
assert(total < 3_000_000, 'Keep the static preview below 3 MB');
const html = await readFile(join(source, 'index.html'), 'utf8');
assert(html.includes("connect-src 'none'"), 'Site must not contact a household API');
assert(
  !/<(?:form|iframe|input)\b|\son\w+=|<style\b/i.test(html),
  'No data collection or inline executable content',
);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Unique HTML ids');
for (const [, attribute, target] of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
  if (target.startsWith('#')) {
    assert(target === '#' || ids.includes(target.slice(1)), `Missing anchor ${target}`);
  } else if (target.startsWith('https://')) {
    assert(
      attribute === 'href' && target.startsWith('https://github.com/davidjpramsay/Hearth'),
      `Unexpected external resource ${target}`,
    );
  } else assert(published.includes(target), `Missing/unapproved local resource ${target}`);
}
assert.equal(
  [...html.matchAll(/<script\b/g)].length,
  1,
  'Only the local gallery script is allowed',
);
assert(/<script src="site\.js" defer><\/script>/.test(html), 'Only external local JavaScript');
assert(
  !/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|document\.cookie/.test(
    await readFile(join(source, 'site.js'), 'utf8'),
  ),
  'Gallery needs no networking or persistence',
);
const css = await readFile(join(source, 'site.css'), 'utf8');
assert(!/@import|https?:|data:/i.test(css), 'No external stylesheet/font dependencies');
for (const [, resource] of css.matchAll(/url\("([^"]+)"\)/g)) assert(published.includes(resource));

if (process.argv[2]) {
  const destination = resolve(process.argv[2]);
  assert(!destination.startsWith(resolve(source)), 'Stage outside the source directory');
  await mkdir(destination, { recursive: true });
  assert.equal((await readdir(destination)).length, 0, 'Artifact staging must start empty');
  for (const file of published) {
    await mkdir(dirname(join(destination, file)), { recursive: true });
    await cp(join(source, file), join(destination, file));
  }
  assert.deepEqual((await walk(destination)).sort(), [...published].sort());
}
console.log(
  `PASS: ${published.length} allowlisted public files; ${total} bytes; local assets, links and privacy boundary checked.`,
);
