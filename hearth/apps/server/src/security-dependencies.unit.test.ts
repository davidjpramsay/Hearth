import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Linter, type ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

interface UriParts {
  scheme?: string;
  host?: string;
  port?: string | number;
  path?: string;
  error?: string;
}
interface UriParser {
  parse(value: string): UriParts;
  serialize(value: UriParts): string;
  normalize(value: UriParts): string;
}

// Exercise both installed majors at their real dependency boundary, not a test-only copy.
const require = createRequire(import.meta.url);
const fastify = createRequire(require.resolve('fastify'));
describe('patched lint glob dependency', () => {
  const eslint = createRequire(require.resolve('eslint'));
  const glob = eslint('minimatch') as {
    (path: string, pattern: string): boolean;
    minimatch(path: string, pattern: string): boolean;
    Minimatch: new (
      pattern: string,
      options: { optimizationLevel: number; braceExpandMax: number },
    ) => { globParts: string[][] };
  };
  it('uses the upstream fix with both old callable and new named imports', async () => {
    expect(eslint('minimatch/package.json').version).toBe('11.0.1');
    expect(glob('src/app.ts', '**/*.ts')).toBe(true);
    expect(glob.minimatch('src/app.js', '**/*.ts')).toBe(false);
    const entry = new URL(
      './dist/esm/index.js',
      pathToFileURL(eslint.resolve('minimatch/package.json')),
    );
    const esm = await import(entry.href);
    expect(esm.default).toBe(esm.minimatch);
    expect(esm.default('src/app.ts', '**/*.ts')).toBe(true);
  });
  it('keeps upstream amplification limits in force', () => {
    const result = new glob.Minimatch('**/../a/b/'.repeat(12) + '*', {
      optimizationLevel: 2,
      braceExpandMax: 64,
    });
    expect(result.globParts.length).toBeLessThanOrEqual(64);
  });
  it('still checks accessible labels with wildcard custom controls', () => {
    const lint = new Linter();
    const config: Linter.Config = {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { 'jsx-a11y': require('eslint-plugin-jsx-a11y') as ESLint.Plugin },
      rules: { 'jsx-a11y/label-has-associated-control': ['error', { controlComponents: ['My*'] }] },
    };
    expect(lint.verify('const App = () => <label>Child <MyInput /></label>', config)).toHaveLength(
      0,
    );
    expect(
      lint.verify('const App = () => <label>Child</label>', config).map((m) => m.ruleId),
    ).toContain('jsx-a11y/label-has-associated-control');
  });
});
describe('build/test source-map dependency', () => {
  it('uses the patched consumer and preserves ordinary source mappings', () => {
    const vitest = createRequire(require.resolve('vitest'));
    const vite = createRequire(vitest.resolve('vite'));
    const postcss = createRequire(vite.resolve('postcss'));
    const dependency = postcss('source-map-js/package.json') as { version: string };
    expect(dependency.version).toBe('1.2.2');
    const sourceMaps = postcss('source-map-js') as {
      SourceMapConsumer: new (map: {
        version: number;
        sources: string[];
        names: string[];
        mappings: string;
      }) => {
        originalPositionFor(position: { line: number; column: number }): {
          source: string;
          line: number;
          column: number;
        };
      };
    };
    const consumer = new sourceMaps.SourceMapConsumer({
      version: 3,
      sources: ['source.ts'],
      names: [],
      mappings: 'AAAA',
    });
    expect(consumer.originalPositionFor({ line: 1, column: 0 })).toMatchObject({
      source: 'source.ts',
      line: 1,
      column: 0,
    });
  });
});
for (const parent of ['@fastify/ajv-compiler', 'fast-json-stringify']) {
  const dependency = createRequire(fastify.resolve(parent));
  const uri = dependency('fast-uri') as UriParser;
  describe(`URI security regressions through ${parent}`, () => {
    it('rejects injected authority delimiters through serialization and normalization', () => {
      for (const port of ['@127.0.0.1:8124', '443/evil']) {
        const input = { scheme: 'https', host: 'trusted.example', port, path: '/app' };
        expect(() => uri.serialize(input)).toThrow();
        expect(() => uri.normalize(input)).toThrow();
      }
    });
    it('rejects malformed authority brackets and canonicalizes encoded host case', () => {
      const misleading = 'http://[@127.0.0.1/app';
      expect(uri.parse(misleading).host).toBe(new URL(misleading).hostname);
      expect(uri.parse('http://[example.com/app').error).toBeDefined();
      expect(uri.parse('//%41.com').host).toBe('a.com');
      expect(uri.parse('//%42.com').host).toBe('b.com');
    });
    it('preserves ordinary ports and valid IPv6 addresses', () => {
      expect(
        uri.serialize({ scheme: 'https', host: 'trusted.example', port: 8443, path: '/app' }),
      ).toBe('https://trusted.example:8443/app');
      expect(uri.parse('https://[::1]:8443/app').error).toBeUndefined();
    });
  });
}
