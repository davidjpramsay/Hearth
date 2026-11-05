import { afterEach, describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { FitnessService } from './fitness-service.js';
import { applyMigrations } from './database.js';
import { SqliteAdminRepository, InMemoryAdminRepository } from './admin-repository.js';
import { buildServer } from './app.js';
import { ModulesService } from './modules-repository.js';
import { DEMO_HOUSEHOLD_ID, DEMO_NOW } from './demo/seed.js';
import { MODULE_IDS, type FitnessConfiguration, type SetFitnessCompletion } from '@hearth/shared';
const actor = { id: 'member_maya', type: 'member' as const, source: 'companion' as const };
const device = { id: 'device_fitness', type: 'device' as const, source: 'tv' as const };
const adult = { 'X-Hearth-Demo-Actor': actor.id };
const base = `/api/v1/households/${DEMO_HOUSEHOLD_ID}`;
const configuration: FitnessConfiguration = {
  selectedMemberIds: ['member_ezra'],
  plans: [
    {
      memberId: 'member_ezra',
      goals: [{ id: 'goal_first', title: 'Run comfortably', targetDate: null, achieved: false }],
      weeklyFocus: 'Move regularly',
      workouts: [
        {
          id: 'workout_one',
          title: 'Morning run',
          activity: 'running',
          days: ['mon', 'wed'],
          durationMinutes: 20,
          distanceKm: null,
          notes: 'An easy outing',
          exercises: [],
        },
      ],
    },
  ],
};
const settings = { requestId: 'request_setup', expectedRevision: 0, configuration };
const check: SetFitnessCompletion = {
  requestId: 'request_check',
  localDate: '2026-08-03',
  memberId: 'member_ezra',
  workoutId: 'workout_one',
  planRevision: 1,
  expectedVersion: 0,
  isCompleted: true,
};
const apps: ReturnType<typeof buildServer>[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});
describe('Fitness durable boundary', () => {
  it('unlinks an optional goal tomorrow without losing its workout, dated check or replay receipt', async () => {
    let now = DEMO_NOW;
    const home = await new InMemoryAdminRepository().getHousehold(DEMO_HOUSEHOLD_ID);
    const service = new FitnessService(undefined, () => new Date(now));
    const linked = structuredClone(configuration);
    linked.plans[0]!.workouts[0]!.goalId = 'goal_first';
    linked.plans[0]!.workouts[0]!.activity = 'class';
    linked.plans[0]!.workouts[0]!.days = ['mon', 'tue'];
    const originalWorkout = structuredClone(linked.plans[0]!.workouts[0]!);
    service.update(home, { ...settings, configuration: linked }, actor);
    const receipt = service.complete(home, check, device);
    const general = structuredClone(linked);
    general.plans[0]!.goals = [];
    general.plans[0]!.workouts[0]!.goalId = null;
    const command = {
      requestId: 'request_general_class',
      expectedRevision: 1,
      configuration: general,
    };
    const result = service.update(home, command, actor);
    expect(result.settings.effectiveFrom).toBe('2026-08-04');
    expect(service.update(home, command, actor)).toEqual({ ...result, replayed: true });
    expect(service.overview(home).people[0]!.days[0]!.sessions[0]).toMatchObject({
      workout: originalWorkout,
      isCompleted: true,
      goal: { id: 'goal_first' },
    });
    now = '2026-08-04T00:01:00+08:00';
    const tomorrow = service.overview(home).people[0]!.days[1]!.sessions[0]!;
    expect(tomorrow.workout).toEqual({ ...originalWorkout, goalId: null });
    expect(tomorrow.goal).toBeNull();
    expect(service.complete(home, check, device)).toEqual({ ...receipt, replayed: true });
    service.complete(
      home,
      { ...check, requestId: 'request_class_tuesday', localDate: '2026-08-04', planRevision: 2 },
      device,
    );
    expect(service.overview(home).people[0]!.streak).toEqual({ current: 2, best: 2 });
  });
  it('starts empty and persists settings/checks/receipts across service recreation', async () => {
    const db = new Database(':memory:');
    applyMigrations(db);
    try {
      const home = await new SqliteAdminRepository(db).getHousehold(DEMO_HOUSEHOLD_ID);
      const service = new FitnessService(db, () => new Date(DEMO_NOW));
      expect(service.getSettings(home).configuration).toEqual({ selectedMemberIds: [], plans: [] });
      const first = service.update(home, settings, actor),
        receipt = service.complete(home, check, device);
      const again = new FitnessService(db, () => new Date(DEMO_NOW));
      expect(again.update(home, settings, actor)).toEqual({ ...first, replayed: true });
      expect(again.complete(home, check, device)).toEqual({ ...receipt, replayed: true });
      expect(again.overview(home).people[0]?.streak).toEqual({ current: 1, best: 1 });
      expect(
        db.prepare("SELECT count(*) n FROM audit_events WHERE action_type LIKE 'fitness.%'").get(),
      ).toEqual({ n: 2 });
      expect(
        db
          .prepare("SELECT safe_summary_json FROM audit_events WHERE action_type LIKE 'fitness.%'")
          .all(),
      ).toEqual([{ safe_summary_json: '{}' }, { safe_summary_json: '{}' }]);
      expect(() => again.complete(home, { ...check, isCompleted: false }, device)).toThrow(
        'already used',
      );
      expect(() =>
        again.complete(home, { ...check, requestId: 'request_stale', isCompleted: false }, device),
      ).toThrow('another device');
      again.complete(
        home,
        { ...check, requestId: 'request_undo', expectedVersion: 1, isCompleted: false },
        device,
      );
      expect(again.overview(home).people[0]?.streak.current).toBe(0);
    } finally {
      db.close();
    }
  });
  it('rolls back a state change when audit persistence fails', async () => {
    const db = new Database(':memory:');
    applyMigrations(db);
    try {
      const home = await new SqliteAdminRepository(db).getHousehold(DEMO_HOUSEHOLD_ID),
        service = new FitnessService(db, () => new Date(DEMO_NOW));
      service.update(home, settings, actor);
      db.exec(
        "CREATE TRIGGER fitness_audit_fail BEFORE INSERT ON audit_events WHEN NEW.action_type LIKE 'fitness.%' BEGIN SELECT RAISE(ABORT,'test audit failure'); END;",
      );
      expect(() => service.complete(home, check, device)).toThrow('test audit failure');
      expect(service.overview(home).people[0]?.days[0]?.sessions[0]?.version).toBe(0);
      expect(db.prepare('SELECT count(*) n FROM fitness_receipts').get()).toEqual({ n: 1 });
    } finally {
      db.close();
    }
  });
  it('applies first setup today, later edits tomorrow without rewriting historical streaks', async () => {
    let now = DEMO_NOW;
    const home = await new InMemoryAdminRepository().getHousehold(DEMO_HOUSEHOLD_ID),
      s = new FitnessService(undefined, () => new Date(now));
    s.update(home, settings, actor);
    const receipt = s.complete(home, check, device);
    const next = structuredClone(configuration);
    next.plans[0]!.workouts[0]!.title = 'Revised run';
    next.plans[0]!.workouts[0]!.days = ['tue'];
    expect(
      s.update(home, { requestId: 'request_edit', expectedRevision: 1, configuration: next }, actor)
        .settings.effectiveFrom,
    ).toBe('2026-08-04');
    expect(s.overview(home).people[0]?.days[0]?.sessions[0]?.workout.title).toBe('Morning run');
    now = '2026-08-04T00:01:00+08:00';
    expect(s.overview(home).people[0]?.days[1]?.sessions[0]?.workout.title).toBe('Revised run');
    expect(s.overview(home).people[0]?.streak).toEqual({ current: 1, best: 1 });
    expect(s.complete(home, check, device)).toEqual({ ...receipt, replayed: true });
    expect(() => s.complete(home, { ...check, requestId: 'request_old' }, device)).toThrow(
      'Refresh',
    );
    expect(() =>
      s.complete(
        home,
        { ...check, localDate: '2026-08-04', requestId: 'request_wrong_plan' },
        device,
      ),
    ).toThrow('plan changed');
    s.complete(
      home,
      { ...check, localDate: '2026-08-04', requestId: 'request_tue', planRevision: 2 },
      device,
    );
    expect(s.overview(home).people[0]?.streak).toEqual({ current: 2, best: 2 });
  });
  it('keeps the latest pending edit, blocks stale settings and foreign people', async () => {
    const home = await new InMemoryAdminRepository().getHousehold(DEMO_HOUSEHOLD_ID),
      s = new FitnessService(undefined, () => new Date(DEMO_NOW));
    s.update(home, settings, actor);
    s.update(home, { ...settings, requestId: 'request_edit1', expectedRevision: 1 }, actor);
    s.update(
      home,
      {
        ...settings,
        requestId: 'request_edit2',
        expectedRevision: 2,
        configuration: { ...configuration, selectedMemberIds: [] },
      },
      actor,
    );
    expect(s.getSettings(home)).toMatchObject({ revision: 3, effectiveFrom: '2026-08-04' });
    expect(s.overview(home).people[0]?.days[1]?.sessions).toEqual([]);
    expect(() => s.update(home, { ...settings, requestId: 'request_stale' }, actor)).toThrow(
      'another device',
    );
    expect(() =>
      s.update(
        home,
        {
          ...settings,
          requestId: 'request_foreign',
          expectedRevision: 3,
          configuration: {
            selectedMemberIds: [],
            plans: [{ ...configuration.plans[0]!, memberId: 'member_elsewhere' }],
          },
        },
        actor,
      ),
    ).toThrow('this home');
    expect(() => s.update(home, settings, device)).toThrow('adult controller');
  });
  it('uses household midnight including DST instead of UTC', async () => {
    const original = await new InMemoryAdminRepository().getHousehold(DEMO_HOUSEHOLD_ID),
      home = { ...original, timezone: 'Australia/Sydney' };
    let now = '2026-10-04T13:01:00Z';
    const s = new FitnessService(undefined, () => new Date(now));
    s.update(home, settings, actor);
    expect(s.overview(home).localDate).toBe('2026-10-05');
    s.complete(home, { ...check, localDate: '2026-10-05' }, device);
    now = '2026-10-05T13:01:00Z';
    expect(s.overview(home).localDate).toBe('2026-10-06');
    expect(s.overview(home).people[0]?.streak.current).toBe(1);
  });
  it('gates all endpoints, preserves off/on data and rejects screens editing settings', async () => {
    const modules = new ModulesService(),
      app = buildServer({ logger: false, modules });
    apps.push(app);
    for (const path of ['/fitness', '/fitness/settings'])
      expect((await app.inject(base + path)).statusCode).toBe(403);
    modules.update(DEMO_HOUSEHOLD_ID, 'fitness', { requestId: 'request_on', enabled: true }, actor);
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: base + '/fitness/settings',
          headers: adult,
          payload: settings,
        })
      ).statusCode,
    ).toBe(200);
    for (const headers of [
      { 'X-Hearth-Demo-Actor': 'member_ezra' },
      { 'user-agent': 'HearthTV/1.0' },
    ])
      for (const method of ['GET', 'PUT'] as const)
        expect(
          (
            await app.inject({
              method,
              url: base + '/fitness/settings',
              headers,
              ...(method === 'PUT' ? { payload: settings } : {}),
            })
          ).statusCode,
        ).toBe(403);
    expect(
      (await app.inject({ method: 'PUT', url: base + '/fitness/completion', payload: check }))
        .statusCode,
    ).toBe(200);
    const read = await app.inject(base + '/fitness');
    expect(read.headers['cache-control']).toBe('private, no-store');
    expect(read.json().people[0].person.capabilities).toBeUndefined();
    modules.update(
      DEMO_HOUSEHOLD_ID,
      'fitness',
      { requestId: 'request_off', enabled: false },
      actor,
    );
    expect(
      (await app.inject({ method: 'PUT', url: base + '/fitness/completion', payload: check }))
        .statusCode,
    ).toBe(403);
    modules.update(
      DEMO_HOUSEHOLD_ID,
      'fitness',
      { requestId: 'request_on_again', enabled: true },
      actor,
    );
    expect(
      (await app.inject(base + '/fitness')).json().people[0].days[0].sessions[0].isCompleted,
    ).toBe(true);
    expect((await app.inject('/api/v1/households/household_other/fitness')).statusCode).toBe(403);
  });
  it('denies anonymous and automation workout access; new switch needs explicit approval', async () => {
    const modules = new ModulesService();
    modules.update(DEMO_HOUSEHOLD_ID, 'fitness', { requestId: 'request_on', enabled: true }, actor);
    const privateApp = buildServer({ logger: false, demoMode: false, modules });
    apps.push(privateApp);
    expect([401, 403]).toContain((await privateApp.inject(base + '/fitness')).statusCode);
    for (const fresh of [false, true]) {
      const app = buildServer({ logger: false, modules });
      apps.push(app);
      const secret = `ha_${'m'.repeat(43)}`;
      const grant = {
        requestId: 'request_grant',
        secret,
        screenIds: [],
        shareChores: false,
        shareCalendar: false,
        controlChores: false,
        controlModules: true,
        ...(fresh ? { moduleIds: [...MODULE_IDS] } : {}),
      };
      expect(
        (
          await app.inject({
            method: 'POST',
            url: base + '/home-assistant-bridge',
            headers: adult,
            payload: grant,
          })
        ).statusCode,
      ).toBe(200);
      const headers = { authorization: `HearthAutomation ${secret}` };
      for (const path of ['/fitness', '/fitness/settings'])
        expect((await app.inject({ url: base + path, headers })).statusCode).toBe(403);
      expect(
        (
          await app.inject({
            method: 'PUT',
            url: base + '/fitness/completion',
            headers,
            payload: check,
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: 'PUT',
            url: '/api/v1/home-assistant/modules/fitness',
            headers,
            payload: { requestId: 'request_toggle', enabled: false },
          })
        ).statusCode,
      ).toBe(fresh ? 200 : 403);
    }
  });
});

it('persists separate goal routines and labels each dated session from its historical plan', async () => {
  const db = new Database(':memory:');
  applyMigrations(db);
  let now = DEMO_NOW;
  try {
    const home = await new SqliteAdminRepository(db).getHousehold(DEMO_HOUSEHOLD_ID);
    const service = new FitnessService(db, () => new Date(now));
    const config = structuredClone(configuration);
    const person = config.plans[0]!;
    person.goals[0]!.weeklyFocus = 'Keep the runs easy';
    person.goals.push({
      id: 'goal_strength',
      title: 'Build strength',
      targetDate: null,
      achieved: false,
      weeklyFocus: 'Two strength sessions',
    });
    person.workouts[0]!.goalId = 'goal_first';
    person.workouts.push({
      ...person.workouts[0]!,
      id: 'workout_strength',
      title: 'Weights',
      activity: 'weights',
      days: ['mon', 'tue'],
      goalId: 'goal_strength',
    });
    service.update(home, { ...settings, configuration: config }, actor);
    const view = service.overview(home).people[0]!;
    expect(view.goals.map((g) => [g.title, g.routine.map((w) => w.id)])).toEqual([
      ['Run comfortably', ['workout_one']],
      ['Build strength', ['workout_strength']],
    ]);
    expect(view.days[0]!.sessions.map((s) => s.goal?.title)).toEqual([
      'Run comfortably',
      'Build strength',
    ]);
    service.complete(home, check, device);
    expect(service.overview(home).people[0]!.streak.current).toBe(0);
    service.complete(
      home,
      { ...check, requestId: 'request_strength', workoutId: 'workout_strength' },
      device,
    );
    expect(service.overview(home).people[0]!.streak.current).toBe(1);
    const next = structuredClone(config);
    next.plans[0]!.goals[0]!.title = 'Run a longer distance';
    next.plans[0]!.goals[1]!.achieved = true;
    service.update(
      home,
      { requestId: 'request_goal_edit', expectedRevision: 1, configuration: next },
      actor,
    );
    now = '2026-08-04T07:00:00+08:00';
    const again = new FitnessService(db, () => new Date(now));
    const after = again.overview(home).people[0]!;
    expect(after.days[0]!.sessions[0]!.goal?.title).toBe('Run comfortably');
    expect(after.days[1]!.sessions).toEqual([]);
    expect(after.days[2]!.sessions[0]!.goal?.title).toBe('Run a longer distance');
    expect(after.streak.current).toBe(1);
    expect(() =>
      again.complete(
        home,
        {
          ...check,
          requestId: 'request_achieved',
          localDate: '2026-08-04',
          planRevision: 2,
          workoutId: 'workout_strength',
        },
        device,
      ),
    ).toThrow('not scheduled');
  } finally {
    db.close();
  }
});
it('preserves an earlier unassigned routine and its exact receipt without guessing a goal', async () => {
  const db = new Database(':memory:');
  applyMigrations(db);
  try {
    const home = await new SqliteAdminRepository(db).getHousehold(DEMO_HOUSEHOLD_ID);
    const service = new FitnessService(db, () => new Date(DEMO_NOW));
    const original = service.update(home, settings, actor);
    service.complete(home, check, device);
    const receipts = db.prepare('SELECT * FROM fitness_receipts').all();
    const again = new FitnessService(db, () => new Date(DEMO_NOW));
    expect(again.getSettings(home).configuration).toEqual(configuration);
    expect(again.overview(home).people[0]!.days[0]!.sessions[0]!.goal).toBeNull();
    expect(again.update(home, settings, actor)).toEqual({ ...original, replayed: true });
    expect(db.prepare('SELECT * FROM fitness_receipts').all()).toEqual(receipts);
    const assigned = structuredClone(configuration);
    assigned.plans[0]!.workouts[0]!.goalId = 'goal_first';
    again.update(
      home,
      { requestId: 'request_assign', expectedRevision: 1, configuration: assigned },
      actor,
    );
    expect(again.overview(home).people[0]!.days[0]!.sessions[0]!.goal).toBeNull();
    expect(again.overview(home).people[0]!.days[2]!.sessions[0]!.goal?.title).toBe(
      'Run comfortably',
    );
    expect(again.overview(home).people[0]!.streak.current).toBe(1);
  } finally {
    db.close();
  }
});
