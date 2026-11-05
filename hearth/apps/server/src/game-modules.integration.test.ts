import Database from 'better-sqlite3';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from './app.js';
import { ModulesService } from './modules-repository.js';
import { applyMigrations } from './database.js';
import { SqliteAdminRepository } from './admin-repository.js';
import { GamesArchive } from './games-archive.js';
import { WordGuessArchive } from './word-guess-archive.js';
import { RepositoryError } from './repository.js';
import type { CompanionAuthRepository } from './companion-auth.js';
import { DEMO_HOUSEHOLD_ID } from './demo/seed.js';

const base = `/api/v1/households/${DEMO_HOUSEHOLD_ID}`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
const actor = { id: 'member_maya', type: 'member' as const, source: 'companion' as const };
const apps: ReturnType<typeof buildServer>[] = [];
const databases: Database.Database[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
  databases.splice(0).forEach((db) => db.close());
});
function harness() {
  const modules = new ModulesService();
  const gamesArchive = new GamesArchive(undefined, true);
  const wordGuessArchive = new WordGuessArchive(undefined, true);
  const app = buildServer({ logger: false, modules, gamesArchive, wordGuessArchive });
  apps.push(app);
  const set = (
    game: string,
    enabled: boolean,
    requestId = `request_${game.toLowerCase()}_${enabled}`,
    headers = adult,
  ) =>
    app.inject({
      method: 'PUT',
      url: `${base}/game-modules/${game}`,
      headers,
      payload: { requestId, enabled },
    });
  return { modules, gamesArchive, wordGuessArchive, app, set };
}
describe('game submodules', () => {
  it('gates catalogue and direct puzzle reads independently of the parent, with adult-only changes', async () => {
    const h = harness();
    const catalogue = (await h.app.inject(`${base}/games/word-groups`)).json();
    const path = `${base}/games/word-groups/${catalogue.puzzles[0].id}`;
    expect((await h.app.inject(path)).statusCode).toBe(200);
    expect(
      (await h.set('connections', false, 'request_child', { 'X-Hearth-Demo-Actor': 'member_ezra' }))
        .statusCode,
    ).toBe(403);
    expect((await h.set('connections', false)).statusCode).toBe(200);
    for (const url of [`${base}/games/word-groups`, path])
      expect((await h.app.inject(url)).json().error.code).toBe('MODULE_DISABLED');
    const config = (await h.app.inject(`${base}/modules`)).json();
    expect(config.enabled.games).toBe(true);
    expect(config.games).toEqual({ connections: false, connectFour: true, wordGuess: true });
    expect((await h.set('connectFour', false)).statusCode).toBe(200);
    expect((await h.set('connections', true)).statusCode).toBe(200);
    expect((await h.app.inject(path)).statusCode).toBe(200);
    h.modules.update(
      DEMO_HOUSEHOLD_ID,
      'games',
      { requestId: 'request_parent_off', enabled: false },
      actor,
    );
    expect((await h.app.inject(path)).json().error.code).toBe('MODULE_DISABLED');
    // Adult settings remain usable with the parent off, and child choices are retained.
    expect((await h.set('connections', false, 'request_while_off')).statusCode).toBe(200);
    h.modules.update(
      DEMO_HOUSEHOLD_ID,
      'games',
      { requestId: 'request_parent_on', enabled: true },
      actor,
    );
    expect(h.modules.get(DEMO_HOUSEHOLD_ID).games).toEqual({
      connections: false,
      connectFour: false,
      wordGuess: true,
    });
    expect((await h.set('unknown', false)).statusCode).toBe(400);
    expect(
      (
        await h.app.inject({
          method: 'PUT',
          url: `${base}/game-modules/connections`,
          headers: adult,
          payload: { requestId: 'request_extra', enabled: true, secret: 'no' },
        })
      ).statusCode,
    ).toBe(400);
  });
  it('persists independent settings, exact receipts and one audit without changing household data', () => {
    const db = new Database(':memory:');
    databases.push(db);
    applyMigrations(db);
    new SqliteAdminRepository(db);
    const first = new ModulesService(db);
    const before = db.prepare('SELECT * FROM members').all();
    const input = { requestId: 'request_game_replay', enabled: false };
    const receipt = first.games.update(DEMO_HOUSEHOLD_ID, 'connections', input, actor);
    const next = new ModulesService(db);
    expect(next.get(DEMO_HOUSEHOLD_ID).games.connections).toBe(false);
    next.games.update(
      DEMO_HOUSEHOLD_ID,
      'connections',
      { requestId: 'request_later', enabled: true },
      actor,
    );
    expect(next.games.update(DEMO_HOUSEHOLD_ID, 'connections', input, actor)).toEqual({
      ...receipt,
      replayed: true,
    });
    expect(next.get(DEMO_HOUSEHOLD_ID).games.connections).toBe(true);
    expect(() => next.games.update(DEMO_HOUSEHOLD_ID, 'connectFour', input, actor)).toThrow(
      'different content',
    );
    expect(
      db
        .prepare("SELECT COUNT(*) n FROM audit_events WHERE action_type='game-module.update'")
        .get(),
    ).toEqual({ n: 2 });
    expect(db.prepare('SELECT * FROM members').all()).toEqual(before);
  });
  it('waits for a preceding archive read before acknowledging off and never reads the provider afterward', async () => {
    const h = harness();
    const original = h.gamesArchive.catalogue.bind(h.gamesArchive);
    let started!: () => void;
    let finish!: () => void;
    const begun = new Promise<void>((resolve) => {
      started = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const read = vi.spyOn(h.gamesArchive, 'catalogue').mockImplementation(async () => {
      started();
      await waiting;
      return original();
    });
    const before = h.app.inject(`${base}/games/word-groups`).then((r) => r);
    await begun;
    let committed = false;
    const off = h.set('connections', false).then((r) => {
      committed = true;
      return r;
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(committed).toBe(false);
    finish();
    expect((await before).statusCode).toBe(200);
    expect((await off).statusCode).toBe(200);
    expect((await h.app.inject(`${base}/games/word-groups`)).json().error.code).toBe(
      'MODULE_DISABLED',
    );
    expect(read).toHaveBeenCalledTimes(1);
  });
});

it('gates Word Guess before provider I/O and keeps separate game switches', async () => {
  const h = harness();
  const read = vi.spyOn(h.wordGuessArchive, 'catalogue');
  const result = await h.app.inject(`${base}/games/word-guess`);
  expect(result.statusCode).toBe(200);
  expect(result.headers['cache-control']).toBe('private, no-store');
  expect(result.json().snapshot.answers.length).toBeGreaterThan(0);
  expect((await h.set('wordGuess', false)).statusCode).toBe(200);
  expect((await h.app.inject(`${base}/games/word-guess`)).json().error.code).toBe(
    'MODULE_DISABLED',
  );
  expect(read).toHaveBeenCalledTimes(1);
  expect((await h.app.inject(`${base}/games/word-groups`)).statusCode).toBe(200);
  expect((await h.set('wordGuess', true)).statusCode).toBe(200);
  h.modules.update(
    DEMO_HOUSEHOLD_ID,
    'games',
    { requestId: 'request_all_games_off', enabled: false },
    actor,
  );
  expect((await h.app.inject(`${base}/games/word-guess`)).statusCode).toBe(403);
  expect(
    (
      await h.set('wordGuess', false, 'request_word_child_denied', {
        'X-Hearth-Demo-Actor': 'member_ezra',
      })
    ).statusCode,
  ).toBe(403);
});

it('denies unauthenticated, mixed and wrong-household word-list reads before provider access', async () => {
  const provider = new WordGuessArchive(undefined, true);
  const read = vi.spyOn(provider, 'catalogue');
  const auth = {
    session: (token: string) => {
      if (token !== 'fixture') throw new RepositoryError('UNAUTHENTICATED', 'Sign in.');
      return {
        authenticated: true,
        householdId: DEMO_HOUSEHOLD_ID,
        memberId: actor.id,
        displayName: 'Maya',
        expiresAt: '2027-01-01T00:00:00Z',
      };
    },
    authenticate: () => actor,
  } as unknown as CompanionAuthRepository;
  const app = buildServer({
    logger: false,
    wordGuessArchive: provider,
    companionAuth: auth,
    runtime: {
      mode: 'private',
      householdId: DEMO_HOUSEHOLD_ID,
      clock: { now: () => new Date('2026-11-05T00:00:00Z') },
    },
  });
  apps.push(app);
  expect((await app.inject(`${base}/games/word-guess`)).statusCode).toBe(401);
  expect(
    (
      await app.inject({
        url: `${base.replace(DEMO_HOUSEHOLD_ID, 'household_other')}/games/word-guess`,
        headers: { cookie: 'hearth_session=fixture' },
      })
    ).statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        url: `${base}/games/word-guess`,
        headers: { cookie: 'hearth_session=fixture', authorization: 'Bearer wrong' },
      })
    ).statusCode,
  ).not.toBe(200);
  expect(read).not.toHaveBeenCalled();
});

it('replays an old game receipt without rewriting it or resetting the new game switch', () => {
  const db = new Database(':memory:');
  databases.push(db);
  applyMigrations(db);
  new SqliteAdminRepository(db);
  const modules = new ModulesService(db);
  const input = { requestId: 'request_legacy_game', enabled: false };
  modules.games.update(DEMO_HOUSEHOLD_ID, 'connections', input, actor);
  const row = db.prepare('SELECT result_json FROM household_game_module_receipts').get() as {
    result_json: string;
  };
  const old = JSON.parse(row.result_json);
  delete old.configuration.enabled.wordGuess;
  const stored = JSON.stringify(old);
  db.prepare('UPDATE household_game_module_receipts SET result_json=?').run(stored);
  modules.games.update(
    DEMO_HOUSEHOLD_ID,
    'wordGuess',
    { requestId: 'request_words_off', enabled: false },
    actor,
  );
  expect(modules.games.update(DEMO_HOUSEHOLD_ID, 'connections', input, actor).replayed).toBe(true);
  expect(modules.get(DEMO_HOUSEHOLD_ID).games.wordGuess).toBe(false);
  expect(
    (
      db
        .prepare('SELECT result_json FROM household_game_module_receipts WHERE request_id=?')
        .get(input.requestId) as { result_json: string }
    ).result_json,
  ).toBe(stored);
});
