import Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODULE_IDS, MorningOverviewSchema, type MorningConfiguration } from '@hearth/shared';
import { buildServer } from './app.js';
import { applyMigrations } from './database.js';
import { SqliteAdminRepository } from './admin-repository.js';
import { SqliteHearthRepository } from './sqlite-hearth-repository.js';
import { SqlitePlanningRepository } from './planning-repository.js';
import { MorningRoutineService } from './morning-routine-service.js';
import { ModulesService } from './modules-repository.js';
import { DEMO_HOUSEHOLD_ID, DEMO_NOW } from './demo/seed.js';
const base = `/api/v1/households/${DEMO_HOUSEHOLD_ID}`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
const actor = { id: 'member_maya', type: 'member' as const, source: 'companion' as const };
const close: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const finish of close.splice(0)) await finish();
});
async function harness() {
  const db = new Database(':memory:');
  applyMigrations(db);
  let instant = DEMO_NOW;
  const clock = { now: () => new Date(instant) };
  const admin = new SqliteAdminRepository(db);
  const chores = new SqliteHearthRepository(db, { clock });
  const planning = new SqlitePlanningRepository(db);
  const morning = new MorningRoutineService(db, clock.now);
  const afternoon = new MorningRoutineService(db, clock.now, 'afternoon');
  const modules = new ModulesService(db, clock.now);
  for (const id of ['morningRoutine', 'afternoonRoutine'] as const)
    modules.update(DEMO_HOUSEHOLD_ID, id, { requestId: `enable_${id}`, enabled: true }, actor);
  const app = buildServer({
    logger: false,
    repository: chores,
    adminRepository: admin,
    planningRepository: planning,
    morningRoutine: morning,
    afternoonRoutine: afternoon,
    modules,
    runtime: { mode: 'test', householdId: DEMO_HOUSEHOLD_ID, clock },
  });
  close.push(async () => {
    await app.close();
    db.close();
  });
  const create = async (person = 'member_ezra') =>
    (
      await planning.createChoreTemplate(
        DEMO_HOUSEHOLD_ID,
        {
          requestId: `create_${person}`,
          title: 'Water the herb garden',
          description: null,
          assigneeIds: [person],
          routineLabel: 'Anytime',
          availableFromTime: null,
          dueTime: null,
          repeat: 'weekly',
          repeatDays: ['MO', 'WE', 'FR'],
          activeFrom: '2026-08-03',
        },
        actor,
      )
    ).template;
  const config = (templateId: string, person = 'member_ezra'): MorningConfiguration => ({
    startTime: '07:00',
    endTime: '08:00',
    selectedMemberIds: [person],
    routines: [
      {
        memberId: person,
        steps: [
          { id: 'step_pack', title: 'Pack sports bag' },
          { id: 'step_chore', title: 'Linked chore', choreTemplateId: templateId },
        ],
      },
    ],
  });
  const save = (
    period: string,
    configuration: MorningConfiguration,
    requestId = `save_${period}`,
    expectedRevision = 0,
  ) =>
    app.inject({
      method: 'PUT',
      url: `${base}/${period}-routine/settings`,
      headers: adult,
      payload: { requestId, expectedRevision, configuration },
    });
  const overview = async (period = 'morning') =>
    MorningOverviewSchema.parse((await app.inject(`${base}/${period}-routine`)).json());
  return {
    db,
    app,
    admin,
    chores,
    morning,
    afternoon,
    planning,
    modules,
    create,
    config,
    save,
    overview,
    setTime: (time: string) => {
      instant = time;
    },
  };
}
describe('routine chore references', () => {
  it('uses the real due schedule, canonical check/undo, exact receipts and one completion record across both routines', async () => {
    const h = await harness();
    const template = await h.create();
    for (const period of ['morning', 'afternoon'])
      expect((await h.save(period, h.config(template.id))).statusCode).toBe(200);
    expect((await h.overview('afternoon')).countdownEnabled).toBe(false);
    const step = (await h.overview()).people[0]!.steps[1]!;
    expect(step).toMatchObject({ title: template.title, isCompleted: false });
    expect(step.chore).toBeDefined();
    const input = {
      method: 'POST' as const,
      url: `${base}/chore-occurrences/${step.chore!.occurrenceId}/completions`,
      payload: { requestId: 'routine_chore_check' },
    };
    const first = await h.app.inject(input);
    expect(first.statusCode).toBe(200);
    expect((await h.app.inject(input)).json()).toMatchObject({ replayed: true });
    for (const period of ['morning', 'afternoon'])
      expect((await h.overview(period)).people[0]!.steps[1]).toMatchObject({
        isCompleted: true,
        chore: { completionId: first.json().occurrence.completionId },
      });
    expect(h.db.prepare('SELECT count(*) n FROM morning_routine_progress').get()).toEqual({ n: 0 });
    expect(h.db.prepare('SELECT count(*) n FROM afternoon_routine_progress').get()).toEqual({
      n: 0,
    });
    expect(
      h.db
        .prepare(
          "SELECT count(*) n FROM audit_events WHERE target_id=? AND action_type='chore.complete'",
        )
        .get(step.chore!.occurrenceId),
    ).toEqual({ n: 1 });
    const undo = await h.app.inject({
      method: 'POST',
      url: `${base}/chore-occurrences/${step.chore!.occurrenceId}/completion-reversals`,
      payload: {
        requestId: 'routine_chore_undo',
        completionId: first.json().occurrence.completionId,
      },
    });
    expect(undo.statusCode).toBe(200);
    expect((await h.overview()).people[0]!.steps[1]!.isCompleted).toBe(false);
    h.setTime('2026-08-04T07:30:00+08:00');
    expect((await h.overview()).people[0]!.steps.map((step) => step.id)).toEqual(['step_pack']);
    h.setTime('2026-08-05T07:30:00+08:00');
    expect((await h.overview()).people[0]!.steps[1]!.isCompleted).toBe(false);
  });
  it('rejects cross-person/missing links and duplicate references, and cannot write a separate routine tick for a chore', async () => {
    const h = await harness();
    const template = await h.create();
    for (const configuration of [
      h.config(template.id, 'member_maya'),
      h.config('template_missing'),
    ])
      expect((await h.save('morning', configuration)).statusCode).toBe(400);
    const duplicates = h.config(template.id);
    duplicates.routines[0]!.steps.push({
      id: 'duplicate',
      title: 'Same',
      choreTemplateId: template.id,
    });
    expect((await h.save('morning', duplicates)).statusCode).toBe(400);
    expect((await h.save('morning', h.config(template.id))).statusCode).toBe(200);
    const result = await h.app.inject({
      method: 'PUT',
      url: `${base}/morning-routine/completion`,
      payload: {
        requestId: 'wrong_tick',
        localDate: '2026-08-03',
        memberId: 'member_ezra',
        stepId: 'step_chore',
        settingsRevision: 1,
        expectedVersion: 0,
        isCompleted: true,
      },
    });
    expect(result.statusCode).toBe(409);
  });
  it('retains links but returns no disabled, excused, cancelled or other-person chore data', async () => {
    const h = await harness();
    const template = await h.create();
    await h.save('morning', h.config(template.id));
    const id = (await h.overview()).people[0]!.steps[1]!.chore!.occurrenceId;
    for (const state of ['skipped', 'excused', 'cancelled']) {
      h.db.prepare('UPDATE chore_occurrences SET state=? WHERE id=?').run(state, id);
      expect((await h.overview()).people[0]!.steps).toHaveLength(1);
    }
    h.db
      .prepare(
        "UPDATE chore_occurrences SET state='pending',assignee_member_id='member_maya' WHERE id=?",
      )
      .run(id);
    expect((await h.overview()).people[0]!.steps).toHaveLength(1);
    h.modules.update(
      DEMO_HOUSEHOLD_ID,
      'chores',
      { requestId: 'off_chores', enabled: false },
      actor,
    );
    const readChores = vi.spyOn(h.chores, 'getChores');
    expect((await h.overview()).people[0]!.steps).toHaveLength(1);
    expect(readChores).not.toHaveBeenCalled();
    expect(
      (
        await h.app.inject({
          method: 'PUT',
          url: `${base}/morning-routine/completion`,
          payload: {
            requestId: 'plain_while_chores_off',
            localDate: '2026-08-03',
            memberId: 'member_ezra',
            stepId: 'step_pack',
            settingsRevision: 1,
            expectedVersion: 0,
            isCompleted: true,
          },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      h.morning.getSettings(await h.admin.getHousehold(DEMO_HOUSEHOLD_ID)).configuration
        .routines[0]!.steps,
    ).toHaveLength(2);
    expect(
      (
        await h.app.inject({
          method: 'POST',
          url: `${base}/chore-occurrences/${id}/completions`,
          payload: { requestId: 'disabled_tick' },
        })
      ).json().error.code,
    ).toBe('MODULE_DISABLED');
    // Settings exact replay remains safe even after the linked feature is disabled.
    expect((await h.save('morning', h.config(template.id))).json().replayed).toBe(true);
  });
  it('isolates morning/afternoon progress and receipts, resets at the household day and survives service recreation', async () => {
    const h = await harness();
    const template = await h.create();
    for (const period of ['morning', 'afternoon']) await h.save(period, h.config(template.id));
    const payload = {
      requestId: 'shared_request_id',
      localDate: '2026-08-03',
      memberId: 'member_ezra',
      stepId: 'step_pack',
      settingsRevision: 1,
      expectedVersion: 0,
      isCompleted: true,
    };
    expect(
      (await h.app.inject({ method: 'PUT', url: `${base}/afternoon-routine/completion`, payload }))
        .statusCode,
    ).toBe(200);
    expect((await h.overview('morning')).people[0]!.steps[0]!.isCompleted).toBe(false);
    expect((await h.overview('afternoon')).people[0]!.steps[0]!.isCompleted).toBe(true);
    const restarted = new MorningRoutineService(h.db, () => new Date(DEMO_NOW), 'afternoon');
    expect(
      restarted.overview(await h.admin.getHousehold(DEMO_HOUSEHOLD_ID)).people[0]!.steps[0]!
        .isCompleted,
    ).toBe(true);
    h.setTime('2026-08-04T00:01:00+08:00');
    expect((await h.overview('afternoon')).people[0]!.steps[0]!.isCompleted).toBe(false);
    expect(
      (
        await h.app.inject({ method: 'PUT', url: `${base}/afternoon-routine/completion`, payload })
      ).json().replayed,
    ).toBe(true);
    expect(
      (
        await h.app.inject({
          method: 'PUT',
          url: `${base}/afternoon-routine/completion`,
          payload: { ...payload, requestId: 'stale_date' },
        })
      ).statusCode,
    ).toBe(409);
    h.modules.update(
      DEMO_HOUSEHOLD_ID,
      'afternoonRoutine',
      { requestId: 'afternoon_off', enabled: false },
      actor,
    );
    expect((await h.app.inject(`${base}/afternoon-routine`)).json().error.code).toBe(
      'MODULE_DISABLED',
    );
    expect((await h.app.inject(`${base}/morning-routine`)).statusCode).toBe(200);
    expect(MODULE_IDS).toContain('afternoonRoutine');
  });
});

it('rejects unauthorised afternoon settings and private anonymous reads', async () => {
  const h = await harness();
  const template = await h.create();
  expect(
    (
      await h.app.inject({
        method: 'PUT',
        url: `${base}/afternoon-routine/settings`,
        payload: {
          requestId: 'screen_edit',
          expectedRevision: 0,
          configuration: h.config(template.id),
        },
      })
    ).statusCode,
  ).toBe(403);
  const privateApp = buildServer({ demoMode: false, logger: false });
  close.push(() => privateApp.close());
  for (const suffix of ['afternoon-routine', 'afternoon-routine/settings'])
    expect((await privateApp.inject(`${base}/${suffix}`)).statusCode).toBe(401);
});
it('migration 40 leaves existing morning progress, settings, receipts, chores and module grants byte-for-byte intact', () => {
  const db = new Database(':memory:');
  try {
    const folder = new URL('./migrations/', import.meta.url);
    for (const file of readdirSync(folder)
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 39)
      .sort())
      db.exec(readFileSync(new URL(file, folder), 'utf8'));
    new SqliteAdminRepository(db);
    new SqliteHearthRepository(db);
    db.prepare('INSERT INTO morning_routine_settings VALUES (?,?,?)').run(
      DEMO_HOUSEHOLD_ID,
      6,
      '{"schoolDays":{},"weekends":{}}',
    );
    db.prepare('INSERT INTO morning_routine_progress VALUES (?,?,?,?,?,?,?,?)').run(
      DEMO_HOUSEHOLD_ID,
      '2026-08-03',
      'schoolDays',
      'member_ezra',
      'step_kept',
      1,
      3,
      DEMO_NOW,
    );
    db.prepare('INSERT INTO morning_routine_receipts VALUES (?,?,?,?,?)').run(
      DEMO_HOUSEHOLD_ID,
      'member:member_maya',
      'request_kept',
      'original-hash',
      '{"kept":true}',
    );
    db.prepare('INSERT INTO household_modules VALUES (?,?,?,?)').run(
      DEMO_HOUSEHOLD_ID,
      'morningRoutine',
      1,
      DEMO_NOW,
    );
    const tables = [
      'morning_routine_settings',
      'morning_routine_progress',
      'morning_routine_receipts',
      'chore_templates',
      'chore_occurrences',
      'household_modules',
      'household_module_receipts',
      'home_assistant_bridge_connections',
      'controller_phone_connections',
      'paired_devices',
    ];
    const before = tables.map((table) => db.prepare(`SELECT * FROM ${table}`).all());
    applyMigrations(db);
    applyMigrations(db);
    expect(tables.map((table) => db.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
    for (const table of [
      'afternoon_routine_settings',
      'afternoon_routine_progress',
      'afternoon_routine_receipts',
    ])
      expect(db.prepare(`SELECT count(*) n FROM ${table}`).get()).toEqual({ n: 0 });
    expect(new ModulesService(db).get(DEMO_HOUSEHOLD_ID).enabled.afternoonRoutine).toBe(false);
    expect(db.pragma('foreign_key_check')).toEqual([]);
  } finally {
    db.close();
  }
});
