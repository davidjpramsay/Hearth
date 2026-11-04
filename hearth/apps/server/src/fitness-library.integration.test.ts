import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FitnessExerciseSchema, MAX_FITNESS_CLIP_BYTES } from '@hearth/shared';
import { FitnessLibraryService } from './fitness-library-service.js';
import { FitnessService } from './fitness-service.js';
import { validateFitnessClip, fitnessByteRange } from './fitness-media.js';
import { applyMigrations } from './database.js';
import { SqliteAdminRepository } from './admin-repository.js';
import { ModulesService } from './modules-repository.js';
import { buildServer } from './app.js';
import { DEMO_HOUSEHOLD_ID, DEMO_NOW } from './demo/seed.js';
const actor = { id: 'member_maya', type: 'member' as const, source: 'companion' as const },
  adult = { 'X-Hearth-Demo-Actor': actor.id };
const base = `/api/v1/households/${DEMO_HOUSEHOLD_ID}/fitness`,
  id = 'library_squat';
const clip = readFileSync(new URL('../../../tests/fixtures/fitness-demo.mp4', import.meta.url));
const save = {
  requestId: 'request_library_create',
  expectedVersion: 0,
  name: 'Squat',
  instructions: 'Synthetic test instructions.',
};
const upload = { requestId: 'request_video_upload', expectedVersion: 1 };
const cleanup: Array<() => void | Promise<void>> = [];
afterEach(async () => {
  for (const fn of cleanup.splice(0).reverse()) await fn();
});
async function harness() {
  const root = mkdtempSync(join(tmpdir(), 'hearth-fitness-library-'));
  cleanup.push(() => rmSync(root, { recursive: true, force: true }));
  const db = new Database(':memory:');
  applyMigrations(db);
  cleanup.push(() => {
    db.close();
  });
  const admin = new SqliteAdminRepository(db),
    home = await admin.getHousehold(DEMO_HOUSEHOLD_ID);
  const service = new FitnessLibraryService(db, root, () => new Date(DEMO_NOW));
  const modules = new ModulesService(db);
  modules.update(home.id, 'fitness', { requestId: 'request_on', enabled: true }, actor);
  const app = buildServer({
    logger: false,
    adminRepository: admin,
    fitnessLibrary: service,
    modules,
  });
  cleanup.push(() => app.close());
  return { root, db, admin, home, service, modules, app };
}
describe('Fitness exercise library', () => {
  it('persists shared instructions, private clips and immutable receipts across restart', async () => {
    const h = await harness();
    const first = h.service.change(h.home, id, save, actor, 'save');
    const receipt = h.service.change(h.home, id, upload, actor, 'upload', clip);
    const mediaId = receipt.exercise!.demonstration!.id;
    expect(statSync(join(h.root, `${mediaId}.mp4`)).mode & 0o777).toBe(0o600);
    // Existing directories and inherited NAS ACLs must not broaden private storage.
    chmodSync(h.root, 0o777);
    chmodSync(join(h.root, `${mediaId}.mp4`), 0o666);
    const again = new FitnessLibraryService(h.db, h.root);
    expect(statSync(h.root).mode & 0o777).toBe(0o700);
    expect(statSync(join(h.root, `${mediaId}.mp4`)).mode & 0o777).toBe(0o600);
    expect(again.list(h.home.id)).toEqual([receipt.exercise]);
    expect(again.change(h.home, id, save, actor, 'save')).toEqual({ ...first, replayed: true });
    expect(again.change(h.home, id, upload, actor, 'upload', clip)).toEqual({
      ...receipt,
      replayed: true,
    });
    expect(readdirSync(h.root)).toHaveLength(1);
    expect(
      h.db
        .prepare("SELECT count(*) n FROM audit_events WHERE action_type LIKE 'fitness.library.%'")
        .get(),
    ).toEqual({ n: 2 });
    expect(
      h.db
        .prepare(
          "SELECT safe_summary_json FROM audit_events WHERE action_type LIKE 'fitness.library.%'",
        )
        .all(),
    ).toEqual([{ safe_summary_json: '{}' }, { safe_summary_json: '{}' }]);
  });
  it('rejects changed reuse and stale writes; replacement/deletion retire old bytes without reverting on replay', async () => {
    const h = await harness();
    h.service.change(h.home, id, save, actor, 'save');
    const first = h.service.change(h.home, id, upload, actor, 'upload', clip),
      old = first.exercise!.demonstration!.id;
    expect(() => h.service.change(h.home, id, { ...save, name: 'Changed' }, actor, 'save')).toThrow(
      'different content',
    );
    expect(() =>
      h.service.change(
        h.home,
        id,
        { ...upload, requestId: 'request_stale', expectedVersion: 0 },
        actor,
        'upload',
        clip,
      ),
    ).toThrow('changed');
    const next = h.service.change(
      h.home,
      id,
      { requestId: 'request_replace', expectedVersion: 2 },
      actor,
      'upload',
      clip,
    );
    expect(() => h.service.asset(h.home.id, old)).toThrow('no longer');
    expect(readdirSync(h.root)).toEqual([`${next.exercise!.demonstration!.id}.mp4`]);
    h.service.change(h.home, id, upload, actor, 'upload', clip);
    expect(h.service.list(h.home.id)[0]).toEqual(next.exercise);
    h.service.change(
      h.home,
      id,
      { requestId: 'request_remove', expectedVersion: 3 },
      actor,
      'remove-video',
    );
    expect(readdirSync(h.root)).toHaveLength(0);
    expect(h.service.list(h.home.id)[0]?.name).toBe('Squat');
    h.service.change(
      h.home,
      id,
      { requestId: 'request_archive', expectedVersion: 4 },
      actor,
      'archive',
    );
    expect(h.service.list(h.home.id)).toEqual([]);
    expect(() =>
      h.service.change(h.home, id, { ...save, requestId: 'request_reuse_deleted' }, actor, 'save'),
    ).toThrow('removed');
  });
  it('rolls back a failed upload transaction and sweeps only generated unreferenced files', async () => {
    const h = await harness();
    h.service.change(h.home, id, save, actor, 'save');
    h.db.exec(
      "CREATE TRIGGER fixture_fail BEFORE INSERT ON fitness_library_receipts WHEN NEW.request_id='request_video_upload' BEGIN SELECT RAISE(ABORT,'fixture failure'); END;",
    );
    expect(() => h.service.change(h.home, id, upload, actor, 'upload', clip)).toThrow(
      'fixture failure',
    );
    expect(h.service.list(h.home.id)[0]?.demonstration).toBeNull();
    expect(readdirSync(h.root)).toHaveLength(0);
    writeFileSync(join(h.root, 'clip_00000000-0000-0000-0000-000000000000.mp4'), clip);
    writeFileSync(join(h.root, 'unrelated.txt'), 'keep');
    new FitnessLibraryService(h.db, h.root);
    expect(readdirSync(h.root)).toEqual(['unrelated.txt']);
  });
  it('validates media bytes, codec, external references, duration and byte limit', () => {
    expect(() => validateFitnessClip(clip)).not.toThrow();
    for (const input of [
      Buffer.from('<html>not video</html>'),
      clip.subarray(0, 50),
      Buffer.alloc(MAX_FITNESS_CLIP_BYTES + 1),
    ])
      expect(() => validateFitnessClip(input)).toThrow('H.264 MP4');
    for (const [from, to] of [
      ['avc1', 'hvc1'],
      ['url ', 'urn '],
    ] as const) {
      const changed = Buffer.from(clip);
      const offset = changed.lastIndexOf(from);
      expect(offset).toBeGreaterThan(0);
      changed.write(to, offset, 'ascii');
      expect(() => validateFitnessClip(changed)).toThrow('H.264 MP4');
    }
    const long = Buffer.from(clip),
      mvhd = long.indexOf('mvhd');
    long.writeUInt32BE(601_000, mvhd + 20);
    expect(() => validateFitnessClip(long)).toThrow('H.264 MP4');
  });
  it('bounds entries and total clip storage before writing bytes', async () => {
    const h = await harness();
    for (let i = 0; i < 100; i++)
      h.service.change(
        h.home,
        `exercise_${i}`,
        { ...save, requestId: `request_${i}` },
        actor,
        'save',
      );
    expect(() => h.service.change(h.home, id, save, actor, 'save')).toThrow('100 exercises');
    h.db.prepare('UPDATE fitness_exercise_library SET entry_json=? WHERE exercise_id=?').run(
      JSON.stringify({
        id: 'exercise_0',
        name: 'Full',
        instructions: '',
        version: 1,
        demonstration: {
          id: 'clip_fixture',
          mimeType: 'video/mp4',
          byteLength: 512 * 1024 * 1024,
        },
      }),
      'exercise_0',
    );
    expect(() => h.service.change(h.home, 'exercise_1', upload, actor, 'upload', clip)).toThrow(
      'library is full',
    );
    expect(readdirSync(h.root)).toHaveLength(0);
  });
  it('serves authenticated bounded ranges and HEAD; old and foreign assets are unavailable', async () => {
    const h = await harness();
    h.service.change(h.home, id, save, actor, 'save');
    const asset = h.service.change(h.home, id, upload, actor, 'upload', clip).exercise!
      .demonstration!;
    const url = `${base}/demonstrations/${asset.id}`;
    const full = await h.app.inject(url);
    expect(full.statusCode).toBe(200);
    expect(full.rawPayload).toEqual(clip);
    expect(full.headers['cache-control']).toBe('private, no-store');
    expect(full.headers['x-content-type-options']).toBe('nosniff');
    for (const [range, start, end] of [
      ['bytes=0-1', 0, 1],
      ['bytes=4-', 4, clip.length - 1],
      ['bytes=-8', clip.length - 8, clip.length - 1],
    ] as const) {
      const res = await h.app.inject({ url, headers: { range } });
      expect(res.statusCode).toBe(206);
      expect(res.rawPayload).toEqual(clip.subarray(start, end + 1));
      expect(res.headers['content-range']).toBe(`bytes ${start}-${end}/${clip.length}`);
    }
    const head = await h.app.inject({ method: 'HEAD', url });
    expect(head.statusCode).toBe(200);
    expect(head.body).toBe('');
    expect(Number(head.headers['content-length'])).toBe(clip.length);
    for (const range of ['bytes=999999999-', 'bytes=5-2', 'bytes=-0', 'bytes=1-2,4-5', 'bad']) {
      const res = await h.app.inject({ url, headers: { range } });
      expect(res.statusCode).toBe(416);
      expect(res.headers['content-range']).toBe(`bytes */${clip.length}`);
    }
    expect(() => h.service.asset('household_other', asset.id)).toThrow('no longer');
    expect((await h.app.inject(url.replace(DEMO_HOUSEHOLD_ID, 'household_other'))).statusCode).toBe(
      403,
    );
  });
  it('denies children, screens, mixed credentials, automation and anonymous private access', async () => {
    const h = await harness();
    for (const headers of [
      { 'X-Hearth-Demo-Actor': 'member_ezra' },
      { 'user-agent': 'HearthTV/1.0' },
      { ...adult, 'user-agent': 'HearthTV/1.0' },
      { authorization: `HearthAutomation ha_${'q'.repeat(43)}` },
    ]) {
      expect(
        (
          await h.app.inject({
            method: 'PUT',
            url: `${base}/exercises/${id}`,
            headers,
            payload: save,
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await h.app.inject({
            method: 'PUT',
            url: `${base}/exercises/${id}/demonstration`,
            headers: {
              ...headers,
              'content-type': 'video/mp4',
              'x-hearth-request-id': 'request_bad',
              'x-hearth-exercise-version': '1',
            },
            payload: clip,
          })
        ).statusCode,
      ).toBe(403);
    }
    const app = buildServer({
      logger: false,
      demoMode: false,
      modules: h.modules,
      fitnessLibrary: h.service,
    });
    cleanup.push(() => app.close());
    for (const path of ['/exercises', `/demonstrations/clip_missing`])
      expect([401, 403]).toContain((await app.inject(base + path)).statusCode);
    expect(h.service.list(h.home.id)).toEqual([]);
  });
  it('blocks all library/media routes while off and retains clips on re-enable', async () => {
    const h = await harness();
    h.service.change(h.home, id, save, actor, 'save');
    const asset = h.service.change(h.home, id, upload, actor, 'upload', clip).exercise!
      .demonstration!;
    h.modules.update(h.home.id, 'fitness', { requestId: 'request_off', enabled: false }, actor);
    for (const path of ['/exercises', `/demonstrations/${asset.id}`])
      expect((await h.app.inject(base + path)).statusCode).toBe(403);
    expect(
      (
        await h.app.inject({
          method: 'PUT',
          url: `${base}/exercises/${id}`,
          headers: adult,
          payload: save,
        })
      ).statusCode,
    ).toBe(403);
    h.modules.update(h.home.id, 'fitness', { requestId: 'request_on_again', enabled: true }, actor);
    expect((await h.app.inject(`${base}/demonstrations/${asset.id}`)).rawPayload).toEqual(clip);
  });
  it('accepts exact HTTP upload retries and rejects unsupported MIME or oversized body', async () => {
    const h = await harness();
    expect(
      (
        await h.app.inject({
          method: 'PUT',
          url: `${base}/exercises/${id}`,
          headers: adult,
          payload: save,
        })
      ).statusCode,
    ).toBe(200);
    const options = {
      method: 'PUT' as const,
      url: `${base}/exercises/${id}/demonstration`,
      headers: {
        ...adult,
        'content-type': 'video/mp4',
        'x-hearth-request-id': upload.requestId,
        'x-hearth-exercise-version': '1',
      },
      payload: clip,
    };
    const firstUpload = await h.app.inject(options);
    expect(firstUpload.statusCode, firstUpload.body).toBe(200);
    expect(firstUpload.json().replayed).toBe(false);
    expect((await h.app.inject(options)).json().replayed).toBe(true);
    expect(
      (await h.app.inject({ ...options, payload: Buffer.alloc(MAX_FITNESS_CLIP_BYTES + 1) }))
        .statusCode,
    ).toBe(413);
    expect(
      (
        await h.app.inject({
          ...options,
          headers: { ...options.headers, 'content-type': 'text/html' },
        })
      ).statusCode,
    ).toBe(415);
  });
  it('preserves legacy hashes and historical plans while rejecting newly invented links', async () => {
    const h = await harness(),
      fitness = new FitnessService(h.db, () => new Date(DEMO_NOW));
    const exercise = { id: 'exercise_plan', name: 'Squat', weightKg: 20, sets: 3, reps: 8 };
    expect(FitnessExerciseSchema.parse(exercise)).not.toHaveProperty('libraryExerciseId');
    h.service.change(h.home, id, save, actor, 'save');
    const configuration = {
      selectedMemberIds: ['member_maya'],
      plans: [
        {
          memberId: 'member_maya',
          weeklyFocus: '',
          goals: [],
          workouts: [
            {
              id: 'workout_one',
              title: 'Weights',
              activity: 'weights' as const,
              days: ['mon' as const],
              durationMinutes: null,
              distanceKm: null,
              notes: '',
              exercises: [{ ...exercise, libraryExerciseId: id }],
            },
          ],
        },
      ],
    };
    const input = { requestId: 'request_plan', expectedRevision: 0, configuration };
    expect(() => fitness.update(h.home, input, actor)).toThrow('this home');
    const result = fitness.update(h.home, input, actor, (x) => h.service.has(h.home.id, x));
    h.service.change(
      h.home,
      id,
      { requestId: 'request_delete', expectedVersion: 1 },
      actor,
      'archive',
    );
    expect(fitness.update(h.home, input, actor)).toEqual({ ...result, replayed: true });
    expect(() =>
      fitness.update(h.home, { ...input, requestId: 'request_keep', expectedRevision: 1 }, actor),
    ).not.toThrow();
    expect(fitness.overview(h.home).people[0]?.days[0]?.sessions[0]?.workout.exercises[0]).toEqual({
      ...exercise,
      libraryExerciseId: id,
    });
    expect(fitnessByteRange('bytes=9999999999999999999-', 10)).toBe('invalid');
  });
});
