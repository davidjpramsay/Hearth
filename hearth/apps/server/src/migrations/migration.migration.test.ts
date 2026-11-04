import { readFileSync, readdirSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';

import { applyMigrations } from '../database.js';

const temporaryDirectories: string[] = [];

describe('0036 Fitness module', () => {
  it('preserves existing module choices, plans and pairing grants without enabling Fitness', () => {
    const database = new Database(':memory:');
    try {
      for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
        .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 35)
        .sort())
        database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
      database.exec(`INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now');
        INSERT INTO household_modules VALUES ('household_kept','photos',0,'now'),('household_kept','morningRoutine',1,'now');
        INSERT INTO household_module_receipts VALUES ('household_kept','member:test','request_kept','hash','{}','now');
        INSERT INTO morning_routine_settings VALUES ('household_kept',9,'{"schoolDays":{},"weekends":{}}');
        INSERT INTO paired_devices (id,household_id,name,device_type,credential_reference,scopes_json,paired_at,capabilities_json) VALUES ('device_kept','household_kept','Kept TV','television','sha256:fixture','["household.read"]','now','[]');`);
      const tables = [
        'households',
        'household_modules',
        'household_module_receipts',
        'morning_routine_settings',
        'paired_devices',
        'controller_phone_connections',
        'home_assistant_bridge_connections',
      ];
      const before = tables.map((table) => database.prepare(`SELECT * FROM ${table}`).all());
      applyMigrations(database);
      applyMigrations(database);
      expect(tables.map((table) => database.prepare(`SELECT * FROM ${table}`).all())).toEqual(
        before,
      );
      for (const table of ['fitness_plans', 'fitness_progress', 'fitness_receipts'])
        expect(database.prepare(`SELECT * FROM ${table}`).all()).toEqual([]);
      expect(database.prepare('SELECT max(version) AS n FROM schema_migrations').get()).toEqual({
        n: 37,
      });
      expect(database.pragma('foreign_key_check')).toEqual([]);
      database
        .prepare('INSERT INTO household_modules VALUES (?,?,?,?)')
        .run('household_kept', 'fitness', 1, 'later');
      expect(
        database.prepare("SELECT enabled FROM household_modules WHERE module_id='fitness'").get(),
      ).toEqual({ enabled: 1 });
    } finally {
      database.close();
    }
  });
});

describe('0035 Morning Routine profiles', () => {
  it('preserves school settings, dated checks, revisions and exact legacy receipts', () => {
    const database = new Database(':memory:');
    try {
      for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
        .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 34)
        .sort())
        database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
      database.exec(
        "INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now');",
      );
      const configuration = {
        startTime: '06:45',
        endTime: '07:50',
        selectedMemberIds: ['member_child'],
        routines: [
          { memberId: 'member_child', steps: [{ id: 'step_kept', title: 'A saved step' }] },
        ],
      };
      database
        .prepare('INSERT INTO morning_routine_settings VALUES (?,?,?)')
        .run('household_kept', 7, JSON.stringify(configuration));
      database
        .prepare('INSERT INTO morning_routine_progress VALUES (?,?,?,?,?,?,?)')
        .run('household_kept', '2026-10-29', 'member_child', 'step_kept', 1, 3, 'now');
      database
        .prepare('INSERT INTO morning_routine_receipts VALUES (?,?,?,?,?)')
        .run(
          'household_kept',
          'device:test',
          'request_kept',
          'unchanged_hash',
          '{"replayed":false}',
        );
      const receipts = database.prepare('SELECT * FROM morning_routine_receipts').all();
      applyMigrations(database);
      applyMigrations(database);
      const row = database
        .prepare('SELECT revision,configuration_json FROM morning_routine_settings')
        .get() as { revision: number; configuration_json: string };
      const profiles = JSON.parse(row.configuration_json);
      expect(row.revision).toBe(7);
      expect(profiles.schoolDays).toEqual({
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        countdownEnabled: true,
        configuration,
      });
      expect(profiles.weekends).toEqual({
        days: ['sat', 'sun'],
        countdownEnabled: false,
        configuration: { ...configuration, routines: [{ memberId: 'member_child', steps: [] }] },
      });
      expect(
        database
          .prepare('SELECT profile_id,completed,version,step_id FROM morning_routine_progress')
          .get(),
      ).toEqual({ profile_id: 'schoolDays', completed: 1, version: 3, step_id: 'step_kept' });
      expect(database.prepare('SELECT * FROM morning_routine_receipts').all()).toEqual(receipts);
      expect(database.pragma('foreign_key_check')).toEqual([]);
    } finally {
      database.close();
    }
  });
});

describe('0033 NBA catalogue extension', () => {
  it('preserves prior flags, receipts and access while adding no enabled NBA override', () => {
    const database = new Database(':memory:');
    try {
      for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
        .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 32)
        .sort())
        database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
      database.exec(
        "INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now'); INSERT INTO household_modules VALUES ('household_kept','photos',0,'now'); INSERT INTO household_module_receipts VALUES ('household_kept','member:test','request_kept','hash','{}','now');",
      );
      const modules = database.prepare('SELECT * FROM household_modules').all();
      const receipts = database.prepare('SELECT * FROM household_module_receipts').all();
      applyMigrations(database);
      applyMigrations(database);
      expect(database.prepare('SELECT * FROM household_modules').all()).toEqual(modules);
      expect(database.prepare('SELECT * FROM household_module_receipts').all()).toEqual(receipts);
      expect(database.prepare('SELECT * FROM nba_settings').all()).toEqual([]);
      expect(database.prepare('SELECT * FROM controller_phone_connections').all()).toEqual([]);
      expect(database.pragma('foreign_key_check')).toEqual([]);
    } finally {
      database.close();
    }
  });
});

describe('0031 additive connection codes', () => {
  it('preserves phones, screens and existing automation grants without creating access', () => {
    const database = new Database(':memory:');
    for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 30)
      .sort())
      database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    database.exec(`INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now');
      INSERT INTO members (id,household_id,display_name,colour,role,created_at,updated_at,capabilities_json) VALUES ('member_kept','household_kept','Adult','#2f766d','adult','now','now','["household.admin"]');
      INSERT INTO controller_phone_connections (id,household_id,member_id,label,source,created_at,last_seen_at,expires_at) VALUES ('phone_kept','household_kept','member_kept','Owner','owner','now','now','later');
      INSERT INTO paired_devices (id,household_id,name,device_type,credential_reference,scopes_json,paired_at,capabilities_json) VALUES ('device_kept','household_kept','TV','television','sha256:fixture','["household.read"]','now','[]');`);
    database
      .prepare(
        'INSERT INTO home_assistant_bridge_connections (id,household_id,request_id,secret_hash,input_hash,record_json) VALUES (?,?,?,?,?,?)',
      )
      .run(
        'bridge_kept',
        'household_kept',
        'request_kept',
        'a'.repeat(64),
        'b'.repeat(64),
        JSON.stringify({
          id: 'bridge_kept',
          screenIds: [],
          shareChores: true,
          shareCalendar: false,
          controlChores: false,
          createdAt: '2026-10-15T00:00:00Z',
          revokedAt: null,
        }),
      );
    const tables = [
      'households',
      'members',
      'controller_phone_connections',
      'paired_devices',
      'home_assistant_bridge_connections',
    ];
    const before = tables.map((table) => database.prepare(`SELECT * FROM ${table}`).all());
    applyMigrations(database);
    applyMigrations(database);
    expect(tables.map((table) => database.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
    expect(
      database.prepare('SELECT count(*) AS n FROM home_assistant_bridge_pairings').get(),
    ).toEqual({ n: 0 });
    expect(
      database.prepare('SELECT count(*) AS n FROM controller_phone_invitation_codes').get(),
    ).toEqual({ n: 0 });
    expect(database.prepare('SELECT max(version) AS n FROM schema_migrations').get()).toEqual({
      n: 37,
    });
    expect(database.pragma('foreign_key_check')).toEqual([]);
    database.close();
  });
});

describe('0030 opt-in Home Assistant bridge migration', () => {
  it('preserves paired-device and adult state and creates no grant automatically', () => {
    const database = new Database(':memory:');
    for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 29)
      .sort())
      database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    database
      .prepare(
        "INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now')",
      )
      .run();
    database
      .prepare(
        "INSERT INTO paired_devices (id,household_id,name,device_type,credential_reference,scopes_json,paired_at,capabilities_json) VALUES ('device_kept','household_kept','Kept TV','television','sha256:fixture','[\"household.read\"]','now','[]')",
      )
      .run();
    const before = database.prepare('SELECT * FROM paired_devices').all();
    applyMigrations(database);
    applyMigrations(database);
    expect(database.prepare('SELECT * FROM paired_devices').all()).toEqual(before);
    expect(
      database.prepare('SELECT count(*) AS total FROM home_assistant_bridge_connections').get(),
    ).toEqual({ total: 0 });
    expect(
      database.prepare('SELECT count(*) AS total FROM home_assistant_bridge_commands').get(),
    ).toEqual({ total: 0 });
    expect(
      database.prepare('SELECT count(*) AS total FROM home_assistant_bridge_chore_receipts').get(),
    ).toEqual({ total: 0 });
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version=30').get()).toEqual({
      name: 'home_assistant_bridge',
    });
    expect(database.pragma('foreign_key_check')).toEqual([]);
    database.close();
  });
});

describe('0029 explicit recovery migration', () => {
  it('adds recovery without auto-designation, revocation or duplicate owners', () => {
    const database = new Database(':memory:');
    for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 28)
      .sort()) {
      database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    }
    const now = '2026-10-12T00:00:00.000Z';
    database
      .prepare(
        "INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,?,?)",
      )
      .run(now, now);
    database
      .prepare(
        "INSERT INTO members (id,household_id,display_name,colour,role,created_at,updated_at,capabilities_json) VALUES ('member_kept','household_kept','Adult','#2f766d','adult',?,?,'[\"household.admin\"]')",
      )
      .run(now, now);
    database
      .prepare(
        "INSERT INTO controller_phone_connections (id,household_id,member_id,label,source,created_at,last_seen_at,expires_at) VALUES ('phone_kept','household_kept','member_kept','Kept phone','owner',?,?,?)",
      )
      .run(now, now, '2027-10-12T00:00:00.000Z');
    applyMigrations(database);
    expect(
      database.prepare('SELECT count(*) AS total FROM controller_phone_recovery_policy').get(),
    ).toEqual({ total: 0 });
    expect(database.prepare('SELECT revoked_at FROM controller_phone_connections').get()).toEqual({
      revoked_at: null,
    });
    expect(() =>
      database
        .prepare(
          "INSERT INTO controller_phone_connections (id,household_id,member_id,label,source,created_at,last_seen_at,expires_at) VALUES ('phone_duplicate','household_kept','member_kept','Duplicate','owner',?,?,?)",
        )
        .run(now, now, '2027-10-12T00:00:00.000Z'),
    ).toThrow(/UNIQUE/);
    expect(database.pragma('foreign_key_check')).toEqual([]);
    applyMigrations(database);
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version=29').get()).toEqual({
      name: 'phone_recovery',
    });
    database.close();
  });
});

describe('0028 independent controller phone migration', () => {
  it('preserves two simultaneous sessions sharing one credential without merging their connections', () => {
    const database = new Database(':memory:');
    const folder = fileURLToPath(new URL('.', import.meta.url));
    for (const file of readdirSync(folder)
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 27)
      .sort())
      database.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    const now = '2026-10-12T00:00:00.000Z';
    const expires = '2026-11-12T00:00:00.000Z';
    database
      .prepare(
        "INSERT INTO households VALUES ('household_upgrade','Upgrade','Australia/Perth','en-AU',1,?,?)",
      )
      .run(now, now);
    database
      .prepare(
        "INSERT INTO members (id,household_id,display_name,colour,role,created_at,updated_at,capabilities_json) VALUES ('member_upgrade','household_upgrade','Adult','#2f766d','adult',?,?,'[\"household.admin\"]')",
      )
      .run(now, now);
    database
      .prepare(
        "INSERT INTO passkey_credentials (id,credential_id,household_id,member_id,webauthn_user_id,public_key,counter,device_type,backed_up,transports_json,label,created_at) VALUES ('passkey_upgrade','credential_upgrade','household_upgrade','member_upgrade','fixture',?,0,'multiDevice',1,'[]','Synced key',?)",
      )
      .run(Buffer.from([1, 2]), now);
    const insert = database.prepare(
      "INSERT INTO companion_sessions (token_hash,household_id,member_id,created_at,last_seen_at,expires_at,credential_id) VALUES (?,'household_upgrade','member_upgrade',?,?,?,'credential_upgrade')",
    );
    insert.run('a'.repeat(64), now, now, expires);
    insert.run('b'.repeat(64), now, now, expires);
    database
      .prepare(
        "INSERT INTO paired_devices (id,household_id,name,device_type,credential_reference,scopes_json,paired_at,capabilities_json) VALUES ('device_kept','household_upgrade','Kept TV','television','fixture','[\"household.read\"]',?,'[\"dpad\"]')",
      )
      .run(now);
    applyMigrations(database);
    const rows = database
      .prepare(
        'SELECT phone_connection_id,credential_id,revoked_at FROM companion_sessions ORDER BY token_hash',
      )
      .all() as { phone_connection_id: string; credential_id: string; revoked_at: string | null }[];
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.phone_connection_id)).size).toBe(2);
    for (const row of rows) {
      expect(row.phone_connection_id).toMatch(/^phone_legacy_/);
      expect(row.credential_id).toBe('credential_upgrade');
      expect(row.revoked_at).toBeNull();
    }
    expect(
      database
        .prepare("SELECT count(*) AS total FROM controller_phone_connections WHERE source='legacy'")
        .get(),
    ).toEqual({ total: 2 });
    expect(
      database.prepare("SELECT revoked_at,name FROM paired_devices WHERE id='device_kept'").get(),
    ).toEqual({ revoked_at: null, name: 'Kept TV' });
    expect(database.pragma('foreign_key_check')).toEqual([]);
    expect(database.inTransaction).toBe(false);
    applyMigrations(database);
    expect(
      database.prepare('SELECT count(*) AS total FROM controller_phone_connections').get(),
    ).toEqual({ total: 2 });
    database.close();
  });
});
const PRE_PAYMENT_HISTORY_MIGRATIONS = [
  '0001_household_core.sql',
  '0002_admin_and_pairing.sql',
  '0003_chore_runtime.sql',
  '0004_calendar_projection.sql',
  '0005_household_planning.sql',
  '0006_home_assistant_projection.sql',
  '0007_tv_device_credentials.sql',
  '0008_photo_library.sql',
  '0009_pocket_money.sql',
  '0010_member_avatars.sql',
  '0011_calendar_connection_setup.sql',
  '0012_passkey_authentication.sql',
  '0013_notices_and_today_sections.sql',
] as const;
const PRE_ADULT_ACCESS_MIGRATIONS = [
  ...PRE_PAYMENT_HISTORY_MIGRATIONS,
  '0014_pocket_money_payment_history.sql',
  '0015_synology_photo_index.sql',
  '0016_meal_planning_polish.sql',
  '0017_chore_occurrence_management.sql',
  '0018_chore_windows_and_order.sql',
  '0019_home_assistant_connection_setup.sql',
] as const;
const PRE_ROUTINE_TIME_OF_DAY_MIGRATIONS = [
  ...PRE_ADULT_ACCESS_MIGRATIONS,
  '0020_adult_access_recovery.sql',
] as const;

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

describe('0001 household core migration', () => {
  it('runs forward on a WAL database and enforces occurrence uniqueness', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    const migrationPath = fileURLToPath(new URL('./0001_household_core.sql', import.meta.url));
    database.exec(readFileSync(migrationPath, 'utf8'));

    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 1').get()).toEqual({
      name: 'household_core',
    });

    database.exec(`
      INSERT INTO households VALUES ('household_test', 'Test', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_test', 'household_test', 'Tester', '#000000', NULL, 'adult', NULL, 'now', 'now');
      INSERT INTO chore_templates VALUES ('template_test', 'household_test', 'Test chore', NULL, 'FREQ=DAILY', 'Morning', NULL, 0, '2026-08-03', NULL, NULL, 'now', 'now');
      INSERT INTO chore_occurrences VALUES ('occurrence_one', 'household_test', 'template_test', '2026-08-03', 'default', 'Test chore', 'Morning', 'member_test', 'pending', NULL, NULL, NULL, 'now', 'now');
    `);
    expect(() =>
      database.exec(`
        INSERT INTO chore_occurrences VALUES ('occurrence_two', 'household_test', 'template_test', '2026-08-03', 'default', 'Test chore', 'Morning', 'member_test', 'pending', NULL, NULL, NULL, 'now', 'now');
      `),
    ).toThrow(/UNIQUE/);
    expect(() =>
      database.exec(`
        INSERT INTO members VALUES ('member_orphan', 'household_missing', 'Orphan', '#000000', NULL, 'adult', NULL, 'now', 'now');
      `),
    ).toThrow(/FOREIGN KEY/);
    database.close();
  });

  it('applies the admin/pairing migration forward with strict device constraints', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 2').get()).toEqual({
      name: 'admin_and_pairing',
    });
    database.exec(`
      INSERT INTO households VALUES ('household_pair', 'Pair', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO paired_devices VALUES (
        'device_pair', 'household_pair', 'TV', 'television', 'secure-reference',
        '["household.read"]', '2026-08-03T00:00:00.000Z', NULL, NULL, 'test', '["dpad"]'
      );
    `);
    expect(() =>
      database.exec(`
        INSERT INTO paired_devices VALUES (
          'device_bad', 'household_pair', 'Bad', 'phone', 'secure-reference',
          '[]', '2026-08-03T00:00:00.000Z', NULL, NULL, 'test', '[]'
        );
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('applies the chore runtime migration with assignee integrity and skip metadata', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 3').get()).toEqual({
      name: 'chore_runtime',
    });
    database.exec(`
      INSERT INTO households VALUES ('household_chore', 'Chore', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_chore', 'household_chore', 'Tester', '#000000', NULL, 'adult', NULL, 'now', 'now', '["chores.complete"]');
      INSERT INTO chore_templates
        (id, household_id, title, description, recurrence_rule, routine_label, due_time,
         points_value, active_from, active_until, archived_at, created_at, updated_at)
      VALUES ('template_chore', 'household_chore', 'Test chore', NULL, 'FREQ=DAILY',
              'Morning', NULL, 0, '2026-08-03', NULL, NULL, 'now', 'now');
      INSERT INTO chore_template_assignees VALUES ('template_chore', 'member_chore');
      INSERT INTO chore_occurrences
        (id, household_id, template_id, scheduled_local_date, instance_key, title_snapshot,
         routine_label_snapshot, assignee_member_id, state, completion_id, completed_at,
         completed_by_actor_id, created_at, updated_at, skipped_at, skipped_by_actor_id)
      VALUES
        ('occurrence_chore', 'household_chore', 'template_chore', '2026-08-03', 'default',
         'Test chore', 'Morning', 'member_chore', 'skipped', NULL, NULL, NULL, 'now', 'now',
         'now', 'member_chore');
    `);
    expect(
      database
        .prepare('SELECT skipped_by_actor_id FROM chore_occurrences WHERE id = ?')
        .get('occurrence_chore'),
    ).toEqual({ skipped_by_actor_id: 'member_chore' });
    expect(() =>
      database.exec(
        "INSERT INTO chore_template_assignees VALUES ('template_chore', 'member_missing');",
      ),
    ).toThrow(/FOREIGN KEY/);
    database.close();
  });

  it('adds durable provider cursor, bounded window and local-date cache indexes', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 4').get()).toEqual({
      name: 'calendar_projection',
    });
    const columns = database.prepare('PRAGMA table_info(calendar_connections)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'sync_cursor',
        'last_attempt_at',
        'last_error_code',
        'sync_window_start',
        'sync_window_end',
      ]),
    );
    const indexes = database.prepare('PRAGMA index_list(calendar_events)').all() as Array<{
      name: string;
    }>;
    expect(indexes.map((index) => index.name)).toContain('calendar_events_local_range_idx');
    const eventColumns = database.prepare('PRAGMA table_info(calendar_events)').all() as Array<{
      name: string;
    }>;
    expect(eventColumns.map((column) => column.name)).toContain('is_recurrence_exception');
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds strict list, meal and reversal-safe reward planning tables', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 5').get()).toEqual({
      name: 'household_planning',
    });
    database.exec(`
      INSERT INTO households VALUES ('household_plan', 'Plan', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_plan', 'household_plan', 'Planner', '#000000', NULL, 'adult', NULL, 'now', 'now', '["household.admin"]');
      INSERT INTO household_lists VALUES ('list_plan', 'household_plan', 'Groceries', 'grocery', '#000000', 0, NULL, 'now', 'now');
      INSERT INTO list_items VALUES ('item_plan', 'list_plan', 'Milk', 'milk', NULL, 0, NULL, NULL, NULL, 'now', 'now');
      INSERT INTO reward_definitions VALUES ('reward_plan', 'household_plan', 'Movie', NULL, 10, 1, NULL, 'now', 'now');
      INSERT INTO reward_ledger_entries VALUES ('entry_plan', 'household_plan', 'member_plan', 10, 'Award', NULL, NULL, NULL, 'member_plan', 'companion', 'now');
      INSERT INTO reward_ledger_entries VALUES ('entry_reverse', 'household_plan', 'member_plan', -10, 'Award reversed', NULL, NULL, 'entry_plan', 'member_plan', 'companion', 'later');
    `);
    expect(() =>
      database.exec(
        "INSERT INTO reward_ledger_entries VALUES ('entry_reverse_twice', 'household_plan', 'member_plan', -10, 'Again', NULL, NULL, 'entry_plan', 'member_plan', 'companion', 'later');",
      ),
    ).toThrow(/UNIQUE/);
    expect(() =>
      database.exec(
        "INSERT INTO household_lists VALUES ('list_bad', 'household_plan', 'Bad', 'unknown', '#000000', 1, NULL, 'now', 'now');",
      ),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds a constrained Home Assistant cache without media metadata', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 6').get()).toEqual({
      name: 'home_assistant_projection',
    });
    database.exec(`
      INSERT INTO households VALUES ('household_home', 'Home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO households VALUES ('household_bad', 'Bad', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO home_state_cache VALUES ('household_home', 1, 'on', 1, 0, 'observed', 'cached');
    `);
    const columns = database.prepare('PRAGMA table_info(home_state_cache)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toEqual([
      'household_id',
      'occupied',
      'television_power',
      'hearth_foreground',
      'protected_media_active',
      'observed_at',
      'cached_at',
    ]);
    expect(() =>
      database.exec(
        "INSERT INTO home_state_cache VALUES ('household_bad', 1, 'playing-music', 1, 0, 'observed', 'cached');",
      ),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds hash-only native television credential exchange fields', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 7').get()).toEqual({
      name: 'tv_device_credentials',
    });
    const columns = database.prepare('PRAGMA table_info(pairing_requests)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['credential_hash', 'application_version', 'credential_exchanged_at']),
    );
    expect(() =>
      database.exec(`
        INSERT INTO pairing_requests
          (id, request_id, code, device_name, status, expires_at, created_at, updated_at, credential_hash)
        VALUES ('pair_bad', 'request_bad', 'BAD123', 'Bad', 'pending', 'later', 'now', 'now', 'plaintext');
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds one approved photo source with opaque, orientation-safe asset records', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 8').get()).toEqual({
      name: 'photo_library',
    });
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 15').get()).toEqual(
      { name: 'synology_photo_index' },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_photo', 'Photo', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO photo_sources VALUES (
        'source_photo', 'household_photo', 'synology-folder', 'Family favourites',
        'config:family-favourites', 'ready', 'now', 'now', 'now'
      );
      INSERT INTO photo_assets VALUES (
        'asset_photo', 'source_photo', 'opaque:1', 'derivative:1', 'thumbnail:1',
        'A family photo.', 1600, 1067, 'landscape', NULL, 1, 0, 'ready', NULL, 'now', 'fingerprint:1'
      );
    `);
    expect(() =>
      database.exec(`
        INSERT INTO photo_assets VALUES (
          'asset_duplicate', 'source_photo', 'opaque:1', 'derivative:2', 'thumbnail:2',
          'Duplicate.', 1600, 1067, 'landscape', NULL, 0, 0, 'ready', NULL, 'now', 'fingerprint:2'
        );
      `),
    ).toThrow(/UNIQUE/);
    expect(() =>
      database.exec(`
        INSERT INTO photo_assets VALUES (
          'asset_bad', 'source_photo', 'opaque:bad', 'derivative:bad', 'thumbnail:bad',
          'Bad.', 0, 1067, 'upside-down', NULL, 0, 0, 'ready', NULL, 'now', 'fingerprint:bad'
        );
      `),
    ).toThrow(/CHECK/);
    const columns = database.prepare('PRAGMA table_info(photo_assets)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).not.toContain('filesystem_path');
    expect(columns.map((column) => column.name)).toContain('source_fingerprint');
    const indexes = database.prepare('PRAGMA index_list(photo_assets)').all() as Array<{
      name: string;
    }>;
    expect(indexes.map((index) => index.name)).toContain('photo_assets_source_status_idx');
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds required child settings plus immutable partial payments and one void per payment', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 9').get()).toEqual({
      name: 'pocket_money',
    });
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 14').get()).toEqual(
      {
        name: 'pocket_money_payment_history',
      },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_money', 'Money', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_child', 'household_money', 'Child', '#000000', NULL, 'child', NULL, 'now', 'now', '["pocket-money.view"]');
      INSERT INTO members VALUES ('member_adult', 'household_money', 'Adult', '#111111', NULL, 'adult', NULL, 'now', 'now', '["household.admin"]');
      INSERT INTO pocket_money_settings VALUES ('household_money', 'member_child', 1200, 'AUD', 'friday', 'now', 'now');
      INSERT INTO pocket_money_payments
        (id, household_id, member_id, week_start, week_end, scheduled_count, completed_count,
         completion_percentage, amount_cents, note, paid_at, paid_by_actor_id, source_channel)
      VALUES (
        'payment_one', 'household_money', 'member_child', '2026-08-03', '2026-08-09',
        6, 4, 67, 400, 'First half', 'now', 'member_adult', 'companion'
      );
      INSERT INTO pocket_money_payments
        (id, household_id, member_id, week_start, week_end, scheduled_count, completed_count,
         completion_percentage, amount_cents, note, paid_at, paid_by_actor_id, source_channel)
      VALUES (
        'payment_two', 'household_money', 'member_child', '2026-08-03', '2026-08-09',
        6, 4, 67, 400, NULL, 'later', 'member_adult', 'companion'
      );
      INSERT INTO pocket_money_payment_voids VALUES (
        'void_one', 'payment_one', 'Recorded twice', 'later', 'member_adult', 'companion'
      );
    `);
    expect(() =>
      database.exec(
        "INSERT INTO pocket_money_settings VALUES ('household_money', 'member_adult', 1000, 'AUD', 'friday', 'now', 'now');",
      ),
    ).toThrow(/active child/);
    expect(
      database
        .prepare(
          'SELECT COUNT(*) AS count FROM pocket_money_payments WHERE household_id = ? AND week_start = ?',
        )
        .get('household_money', '2026-08-03'),
    ).toEqual({ count: 2 });
    expect(() =>
      database.exec(
        "INSERT INTO pocket_money_payment_voids VALUES ('void_two', 'payment_one', 'Another reason', 'later', 'member_adult', 'companion');",
      ),
    ).toThrow(/UNIQUE/);
    expect(() =>
      database.exec(
        "INSERT INTO pocket_money_payment_voids VALUES ('void_short', 'payment_two', 'x', 'later', 'member_adult', 'companion');",
      ),
    ).toThrow(/CHECK/);
    expect(() =>
      database.exec(
        "INSERT INTO pocket_money_settings VALUES ('household_money', 'member_child', 0, 'AUD', 'friday', 'now', 'now');",
      ),
    ).toThrow();
    database.close();
  });

  it('preserves existing weekly payment snapshots while upgrading to payment history', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    for (const filename of PRE_PAYMENT_HISTORY_MIGRATIONS) {
      const path = fileURLToPath(new URL(filename, import.meta.url));
      database.exec(readFileSync(path, 'utf8'));
    }
    database.exec(`
      INSERT INTO households VALUES ('household_upgrade', 'Upgrade', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_upgrade_child', 'household_upgrade', 'Child', '#000000', NULL, 'child', NULL, 'now', 'now', '["pocket-money.view"]');
      INSERT INTO members VALUES ('member_upgrade_adult', 'household_upgrade', 'Adult', '#111111', NULL, 'adult', NULL, 'now', 'now', '["household.admin"]');
      INSERT INTO pocket_money_settings VALUES ('household_upgrade', 'member_upgrade_child', 1200, 'AUD', 'friday', 'now', 'now');
      INSERT INTO pocket_money_payments VALUES (
        'payment_upgrade', 'household_upgrade', 'member_upgrade_child', '2026-08-03', '2026-08-09',
        6, 4, 67, 800, 'now', 'member_upgrade_adult', 'companion'
      );
    `);
    const migrationPath = fileURLToPath(
      new URL('0014_pocket_money_payment_history.sql', import.meta.url),
    );
    database.exec(readFileSync(migrationPath, 'utf8'));

    expect(
      database
        .prepare('SELECT id, amount_cents, note FROM pocket_money_payments WHERE id = ?')
        .get('payment_upgrade'),
    ).toEqual({ id: 'payment_upgrade', amount_cents: 800, note: null });
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds bounded local member avatars with household integrity', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 10').get()).toEqual(
      {
        name: 'member_avatars',
      },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_avatar', 'Avatar', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO households VALUES ('household_other', 'Other', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_avatar', 'household_avatar', 'Person', '#000000', '/original.jpg', 'adult', NULL, 'now', 'now', '["household.admin"]');
    `);
    database
      .prepare(
        `INSERT INTO member_avatars
          (household_id, member_id, mime_type, image_bytes, version_key, original_avatar_key,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'household_avatar',
        'member_avatar',
        'image/jpeg',
        Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
        '123456789abc',
        '/original.jpg',
        'now',
        'now',
      );
    expect(
      database.prepare('SELECT length(image_bytes) AS size FROM member_avatars').get(),
    ).toEqual({ size: 4 });
    expect(() =>
      database
        .prepare(
          `INSERT INTO member_avatars
            (household_id, member_id, mime_type, image_bytes, version_key, original_avatar_key,
             created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          'household_other',
          'member_avatar',
          'image/jpeg',
          Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
          'abcdef123456',
          '/original.jpg',
          'now',
          'now',
        ),
    ).toThrow(/household mismatch/);
    database.close();
  });

  it('adds credential-free calendar setup metadata with strict selected-calendar JSON', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 11').get()).toEqual(
      { name: 'calendar_connection_setup' },
    );
    const columns = database
      .prepare('PRAGMA table_info(calendar_connection_settings)')
      .all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['server_host', 'account_hint', 'selected_calendars_json']),
    );
    expect(columns.map((column) => column.name)).not.toEqual(
      expect.arrayContaining(['password', 'username', 'server_url', 'credential']),
    );
    database.exec(`
      INSERT INTO households VALUES ('household_calendar_setup', 'Calendar', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO calendar_connection_settings VALUES (
        'household_calendar_setup', 'calendar_setup_test', 'caldav', 'Family calendars',
        'caldav.icloud.com', 'f•••@example.com', 'ready',
        '[{"displayName":"Family","color":"#2f766d","ownerMemberId":null}]',
        'now', 'now', NULL, 'now', 'now'
      );
    `);
    expect(() =>
      database.exec(`
        UPDATE calendar_connection_settings
        SET selected_calendars_json = 'not-json'
        WHERE household_id = 'household_calendar_setup';
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds one constrained weather location per household', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 22').get()).toEqual(
      { name: 'weather_location' },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_weather', 'Weather', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO weather_locations VALUES (
        'household_weather', 'Baldivis, WA', -32.328, 115.82, 'search', 'now', 'now'
      );
    `);
    expect(() =>
      database.exec(`
        UPDATE weather_locations SET latitude = 95 WHERE household_id = 'household_weather';
      `),
    ).toThrow(/CHECK/);
    expect(() =>
      database.exec(`
        UPDATE weather_locations SET source = 'guess' WHERE household_id = 'household_weather';
      `),
    ).toThrow(/CHECK/);
    database.close();
  });

  it('adds managed photo uploads and optional folder import status with strict constraints', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 23').get()).toEqual(
      { name: 'managed_photo_uploads' },
    );
    database.exec(`
      INSERT INTO households VALUES
        ('household_photo_upload', 'Photos', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO photo_sources VALUES
        ('source_photo_upload', 'household_photo_upload', 'synology-folder', 'Family photos',
         'environment:approved-photo-folder', 'ready', 'now', 'now', 'now');
      INSERT INTO photo_assets VALUES
        ('asset_photo_upload', 'source_photo_upload', 'managed:hash', 'hash-display.webp',
         'hash-thumbnail.webp', 'Family photo', 1200, 800, 'landscape', 'now', 1, 0, 'ready',
         NULL, 'now', 'hash');
      INSERT INTO photo_managed_uploads VALUES
        ('upload_photo', 'household_photo_upload', 'asset_photo_upload', 'hash-master.webp',
         'hash', 1024, 'now', 'member_adult', 'companion');
      INSERT INTO photo_folder_import_status VALUES
        ('household_photo_upload', 'unconfigured', NULL, 0, 'now');
    `);
    expect(() =>
      database.exec(`
        UPDATE photo_managed_uploads SET byte_size = 0 WHERE id = 'upload_photo';
      `),
    ).toThrow(/CHECK/);
    expect(() =>
      database.exec(`
        UPDATE photo_folder_import_status SET status = 'guess'
        WHERE household_id = 'household_photo_upload';
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds public-key passkeys and hash-only companion sessions', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 12').get()).toEqual(
      { name: 'passkey_authentication' },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_auth', 'Auth home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES (
        'member_auth', 'household_auth', 'Adult', '#2f766d', NULL, 'adult', NULL,
        'now', 'now', '["household.admin"]'
      );
    `);
    database
      .prepare(
        `INSERT INTO passkey_credentials
          (id, credential_id, household_id, member_id, webauthn_user_id, public_key, counter,
           device_type, backed_up, transports_json, label, created_at, last_used_at, revoked_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'multiDevice', 1, ?, ?, ?, NULL, NULL)`,
      )
      .run(
        'passkey_auth',
        'credential_auth',
        'household_auth',
        'member_auth',
        'webauthn_user_auth',
        Buffer.from([1, 2, 3]),
        '["internal"]',
        'iPhone',
        'now',
      );
    database
      .prepare(
        `INSERT INTO companion_sessions
          (token_hash, household_id, member_id, created_at, last_seen_at, expires_at, revoked_at)
         VALUES (?, ?, ?, 'now', 'now', 'later', NULL)`,
      )
      .run('a'.repeat(64), 'household_auth', 'member_auth');
    expect(
      database.prepare('SELECT length(public_key) AS bytes FROM passkey_credentials').get(),
    ).toEqual({ bytes: 3 });
    expect(() =>
      database
        .prepare(
          `INSERT INTO companion_sessions
            (token_hash, household_id, member_id, created_at, last_seen_at, expires_at, revoked_at)
           VALUES ('plain-token', 'household_auth', 'member_auth', 'now', 'now', 'later', NULL)`,
        )
        .run(),
    ).toThrow(/CHECK/);
    database.close();
  });

  it('adds constrained notices and one Today preference row per household', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 13').get()).toEqual(
      { name: 'notices_and_today_sections' },
    );
    database.exec(`
      INSERT INTO households VALUES ('household_notice', 'Notice home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO today_section_preferences
        (household_id, show_dinner, show_list_summary, show_notice, show_photo,
         show_daily_verse, updated_at)
      VALUES ('household_notice', 1, 0, 1, 0, 1, 'now');
      INSERT INTO announcements VALUES (
        'notice_test', 'household_notice', 'Bins tonight', 'important',
        '2026-08-03T00:00:00.000Z', '2026-08-04T00:00:00.000Z', NULL, 'now', 'now'
      );
    `);
    expect(() =>
      database.exec(
        `INSERT INTO today_section_preferences
          (household_id, show_dinner, show_list_summary, show_notice, show_photo,
           show_daily_verse, updated_at)
         VALUES ('household_notice', 2, 1, 1, 1, 0, 'now');`,
      ),
    ).toThrow(/UNIQUE|CHECK/);
    expect(() =>
      database.exec(`
        INSERT INTO announcements VALUES (
          'notice_bad', 'household_notice', 'Bad', 'urgent',
          '2026-08-04T00:00:00.000Z', '2026-08-03T00:00:00.000Z', NULL, 'now', 'now'
        );
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds optional daily verse visibility and a bounded per-passage cache', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 24').get()).toEqual(
      { name: 'daily_bible_verse' },
    );
    database.exec(`
      INSERT INTO households VALUES
        ('household_verse', 'Verse home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO today_section_preferences
        (household_id, show_dinner, show_list_summary, show_notice, show_photo,
         show_daily_verse, updated_at)
      VALUES ('household_verse', 1, 1, 1, 1, 1, 'now');
      INSERT INTO daily_verse_cache VALUES
        ('household_verse', 'John 13:34', 'Love one another. (ESV)',
         'https://www.esv.org/', 'now');
    `);
    expect(
      database.prepare('SELECT show_daily_verse FROM today_section_preferences').get(),
    ).toEqual({ show_daily_verse: 1 });
    expect(() =>
      database.exec(`
        UPDATE today_section_preferences
        SET show_daily_verse = 2
        WHERE household_id = 'household_verse';
      `),
    ).toThrow(/CHECK/);
    database.close();
  });

  it('adds bounded preparation time to saved meals without rewriting planning history', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 16').get()).toEqual(
      { name: 'meal_planning_polish' },
    );
    const columns = database.prepare('PRAGMA table_info(saved_meals)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toContain('preparation_minutes');
    database.exec(`
      INSERT INTO households VALUES ('household_meals', 'Meal home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO saved_meals
        (id, household_id, name, description, favourite, archived_at, created_at, updated_at, preparation_minutes)
      VALUES ('saved_meal_test', 'household_meals', 'Tacos', NULL, 1, NULL, 'now', 'now', 25);
    `);
    expect(
      database
        .prepare('SELECT preparation_minutes FROM saved_meals WHERE id = ?')
        .get('saved_meal_test'),
    ).toEqual({ preparation_minutes: 25 });
    expect(() =>
      database.exec(`
        INSERT INTO saved_meals
          (id, household_id, name, description, favourite, archived_at, created_at, updated_at, preparation_minutes)
        VALUES ('saved_meal_invalid', 'household_meals', 'Impossible', NULL, 0, NULL, 'now', 'now', 0);
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds durable chore detail snapshots and an indexed occurrence audit history', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 17').get()).toEqual(
      { name: 'chore_occurrence_management' },
    );
    const columns = database.prepare('PRAGMA table_info(chore_occurrences)').all() as Array<{
      name: string;
    }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['description_snapshot', 'due_time_snapshot']),
    );
    const indexes = database.prepare('PRAGMA index_list(audit_events)').all() as Array<{
      name: string;
    }>;
    expect(indexes.map((index) => index.name)).toContain('audit_events_target_history_idx');
    database.exec(`
      INSERT INTO households VALUES ('household_chore_detail', 'Chore home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_chore_detail', 'household_chore_detail', 'Child', '#1668b7', NULL, 'child', NULL, 'now', 'now', '["chores.complete"]');
      INSERT INTO chore_templates
        (id, household_id, title, description, recurrence_rule, routine_label, due_time,
         points_value, active_from, active_until, archived_at, created_at, updated_at)
      VALUES
        ('template_chore_detail', 'household_chore_detail', 'Pack bag', 'Put lunch inside',
         'FREQ=DAILY', 'Morning', '07:30', 0, '2026-08-10', NULL, NULL, 'now', 'now');
      INSERT INTO chore_occurrences
        (id, household_id, template_id, scheduled_local_date, instance_key, title_snapshot,
         routine_label_snapshot, assignee_member_id, state, completion_id, completed_at,
         completed_by_actor_id, created_at, updated_at, skipped_at, skipped_by_actor_id,
         description_snapshot, due_time_snapshot)
      VALUES
        ('occurrence_chore_detail', 'household_chore_detail', 'template_chore_detail',
         '2026-08-10', 'default', 'Pack bag', 'Morning', 'member_chore_detail', 'pending',
         NULL, NULL, NULL, 'now', 'now', NULL, NULL, 'Put lunch inside', '07:30');
    `);
    expect(
      database
        .prepare(
          'SELECT description_snapshot, due_time_snapshot FROM chore_occurrences WHERE id = ?',
        )
        .get('occurrence_chore_detail'),
    ).toEqual({ description_snapshot: 'Put lunch inside', due_time_snapshot: '07:30' });
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('migrates chore windows and stable household order without rewriting occurrences', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    const beforeOrder = [
      '0001_household_core.sql',
      '0002_admin_and_pairing.sql',
      '0003_chore_runtime.sql',
      '0004_calendar_projection.sql',
      '0005_household_planning.sql',
      '0006_home_assistant_projection.sql',
      '0007_tv_device_credentials.sql',
      '0008_photo_library.sql',
      '0009_pocket_money.sql',
      '0010_member_avatars.sql',
      '0011_calendar_connection_setup.sql',
      '0012_passkey_authentication.sql',
      '0013_notices_and_today_sections.sql',
      '0014_pocket_money_payment_history.sql',
      '0015_synology_photo_index.sql',
      '0016_meal_planning_polish.sql',
      '0017_chore_occurrence_management.sql',
    ];
    for (const file of beforeOrder) {
      database.exec(readFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), 'utf8'));
    }
    database.exec(`
      INSERT INTO households VALUES ('household_order', 'Order home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES ('member_order', 'household_order', 'Child', '#1668b7', NULL, 'child', NULL, 'now', 'now', '["chores.complete"]');
      INSERT INTO chore_templates
        (id, household_id, title, description, recurrence_rule, routine_label, due_time,
         points_value, active_from, active_until, archived_at, created_at, updated_at)
      VALUES
        ('template_later', 'household_order', 'Later', NULL, 'FREQ=DAILY', 'Morning', '08:00', 0, '2026-08-10', NULL, NULL, '2026-08-10T08:00:00Z', 'now'),
        ('template_earlier', 'household_order', 'Earlier', NULL, 'FREQ=DAILY', 'Morning', '07:30', 0, '2026-08-10', NULL, NULL, '2026-08-10T07:00:00Z', 'now');
      INSERT INTO chore_template_assignees VALUES ('template_later', 'member_order');
      INSERT INTO chore_template_assignees VALUES ('template_earlier', 'member_order');
      INSERT INTO chore_occurrences
        (id, household_id, template_id, scheduled_local_date, instance_key, title_snapshot,
         routine_label_snapshot, assignee_member_id, state, completion_id, completed_at,
         completed_by_actor_id, created_at, updated_at, description_snapshot, due_time_snapshot)
      VALUES
        ('occurrence_later', 'household_order', 'template_later', '2026-08-10', 'default',
         'Later', 'Morning', 'member_order', 'pending', NULL, NULL, NULL, 'now', 'now', NULL, '08:00'),
        ('occurrence_earlier', 'household_order', 'template_earlier', '2026-08-10', 'default',
         'Earlier', 'Morning', 'member_order', 'pending', NULL, NULL, NULL, 'now', 'now', NULL, '07:30');
    `);
    database.exec(
      readFileSync(
        fileURLToPath(new URL('./0018_chore_windows_and_order.sql', import.meta.url)),
        'utf8',
      ),
    );

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 18').get()).toEqual(
      { name: 'chore_windows_and_order' },
    );
    expect(
      database.prepare('SELECT id, sort_order FROM chore_templates ORDER BY sort_order').all(),
    ).toEqual([
      { id: 'template_earlier', sort_order: 0 },
      { id: 'template_later', sort_order: 1 },
    ]);
    expect(
      database
        .prepare(
          'SELECT id, sort_order_snapshot FROM chore_occurrences ORDER BY sort_order_snapshot',
        )
        .all(),
    ).toEqual([
      { id: 'occurrence_earlier', sort_order_snapshot: 0 },
      { id: 'occurrence_later', sort_order_snapshot: 1 },
    ]);
    const templateColumns = database.prepare('PRAGMA table_info(chore_templates)').all() as Array<{
      name: string;
    }>;
    const occurrenceColumns = database
      .prepare('PRAGMA table_info(chore_occurrences)')
      .all() as Array<{ name: string }>;
    expect(templateColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['available_from_time', 'sort_order']),
    );
    expect(occurrenceColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['available_from_time_snapshot', 'sort_order_snapshot']),
    );
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds credential-free Home Assistant setup metadata with strict mapping JSON', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 19').get()).toEqual(
      { name: 'home_assistant_connection_setup' },
    );
    const columns = database
      .prepare('PRAGMA table_info(home_assistant_connection_settings)')
      .all() as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        'server_host',
        'instance_name',
        'state_mappings_json',
        'action_mappings_json',
      ]),
    );
    expect(columns.map((column) => column.name)).not.toEqual(
      expect.arrayContaining(['token', 'server_url', 'entity_id', 'credential']),
    );
    database.exec(`
      INSERT INTO households VALUES ('household_ha_setup', 'Home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO home_assistant_connection_settings VALUES (
        'household_ha_setup', 'home_assistant_setup_test', 'home-assistant', 'Living room',
        'homeassistant.local', 'Ramsay Home', '2026.8.1', 'ready',
        '{"occupancy":"Family home","televisionPower":"Living room television","hearthForeground":"Hearth app active","protectedMedia":"Protected playback active"}',
        '{"evening":"Evening","goodnight":"Goodnight","screenOff":"Screen off"}',
        'now', 'now', NULL, 'now', 'now'
      );
    `);
    expect(() =>
      database.exec(`
        UPDATE home_assistant_connection_settings
        SET action_mappings_json = 'not-json'
        WHERE household_id = 'household_ha_setup';
      `),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('adds adult recovery codes and links sessions to revocable passkeys', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    for (const migration of PRE_ADULT_ACCESS_MIGRATIONS) {
      database.exec(readFileSync(fileURLToPath(new URL(migration, import.meta.url)), 'utf8'));
    }
    database.exec(`
      INSERT INTO households
        (id, name, timezone, locale, week_starts_on, created_at, updated_at)
      VALUES ('household_existing', 'Existing', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members
        (id, household_id, display_name, colour, avatar_key, role, archived_at, created_at,
         updated_at, capabilities_json)
      VALUES ('member_existing', 'household_existing', 'Existing adult', '#2f766d', NULL,
              'adult', NULL, 'now', 'now', '["household.admin","household.view"]');
      INSERT INTO passkey_credentials
        (id, credential_id, household_id, member_id, webauthn_user_id, public_key, counter,
         device_type, backed_up, transports_json, label, created_at, last_used_at, revoked_at)
      VALUES ('passkey_existing', 'credential_existing', 'household_existing', 'member_existing',
              'user_existing', X'0102', 0, 'singleDevice', 0, '[]', 'Existing iPhone', 'now',
              NULL, NULL);
      INSERT INTO companion_sessions
        (token_hash, household_id, member_id, created_at, last_seen_at, expires_at, revoked_at)
      VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              'household_existing', 'member_existing', 'now', 'now', 'later', NULL);
    `);
    database.exec(
      readFileSync(
        fileURLToPath(new URL('./0020_adult_access_recovery.sql', import.meta.url)),
        'utf8',
      ),
    );

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 20').get()).toEqual(
      { name: 'adult_access_recovery' },
    );
    const sessionColumns = database
      .prepare('PRAGMA table_info(companion_sessions)')
      .all() as Array<{ name: string }>;
    expect(sessionColumns.map((column) => column.name)).toContain('credential_id');
    expect(
      database
        .prepare(
          `SELECT credential_id FROM companion_sessions
           WHERE household_id = 'household_existing'`,
        )
        .get(),
    ).toEqual({ credential_id: 'credential_existing' });
    database.exec(`
      INSERT INTO households VALUES ('household_access', 'Home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members VALUES (
        'member_access', 'household_access', 'Adult', '#2f766d', NULL, 'adult', NULL,
        'now', 'now', '["household.admin","household.view"]'
      );
      INSERT INTO companion_recovery_codes VALUES (
        'recovery_one', 'household_access', 'member_access',
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'member_access', '2026-08-15T00:00:00.000Z', '2027-02-11T00:00:00.000Z', NULL, NULL
      );
    `);
    expect(() =>
      database.exec(`
        INSERT INTO companion_recovery_codes VALUES (
          'recovery_two', 'household_access', 'member_access',
          'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          'member_access', '2026-08-15T00:00:00.000Z', '2027-02-11T00:00:00.000Z', NULL, NULL
        );
      `),
    ).toThrow(/UNIQUE/);
    database.exec(`
      UPDATE companion_recovery_codes SET revoked_at = '2026-08-15T00:01:00.000Z'
      WHERE id = 'recovery_one';
      INSERT INTO companion_recovery_codes VALUES (
        'recovery_two', 'household_access', 'member_access',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'member_access', '2026-08-15T00:02:00.000Z', '2027-02-11T00:00:00.000Z', NULL, NULL
      );
    `);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('normalizes free-text routine groups into the five time-of-day values', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    for (const migration of PRE_ROUTINE_TIME_OF_DAY_MIGRATIONS) {
      database.exec(readFileSync(fileURLToPath(new URL(migration, import.meta.url)), 'utf8'));
    }
    database.exec(`
      INSERT INTO households
        (id, name, timezone, locale, week_starts_on, created_at, updated_at)
      VALUES ('household_routine_time', 'Home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO members
        (id, household_id, display_name, colour, avatar_key, role, archived_at, created_at,
         updated_at, capabilities_json)
      VALUES ('member_routine_time', 'household_routine_time', 'Child', '#2f766d', NULL,
              'child', NULL, 'now', 'now', '["household.view","chores.complete"]');
      INSERT INTO chore_templates
        (id, household_id, title, description, recurrence_rule, routine_label, due_time,
         points_value, active_from, active_until, archived_at, created_at, updated_at)
      VALUES
        ('template_school', 'household_routine_time', 'Bag', NULL, 'FREQ=DAILY',
         'School morning', NULL, 0, '2026-08-17', NULL, NULL, 'now', 'now'),
        ('template_dinner', 'household_routine_time', 'Dishes', NULL, 'FREQ=DAILY',
         'After dinner', NULL, 0, '2026-08-17', NULL, NULL, 'now', 'now'),
        ('template_extra', 'household_routine_time', 'Bins', NULL, 'FREQ=ONCE',
         'Extra jobs', NULL, 0, '2026-08-17', '2026-08-17', NULL, 'now', 'now');
      INSERT INTO chore_template_assignees VALUES
        ('template_school', 'member_routine_time'),
        ('template_dinner', 'member_routine_time'),
        ('template_extra', 'member_routine_time');
      INSERT INTO chore_occurrences
        (id, household_id, template_id, scheduled_local_date, instance_key, title_snapshot,
         routine_label_snapshot, assignee_member_id, state, completion_id, completed_at,
         completed_by_actor_id, created_at, updated_at)
      VALUES
        ('occurrence_school', 'household_routine_time', 'template_school', '2026-08-17',
         'default', 'Bag', 'Before school', 'member_routine_time', 'pending', NULL, NULL, NULL,
         'now', 'now'),
        ('occurrence_bed', 'household_routine_time', 'template_dinner', '2026-08-17',
         'bed', 'Teeth', 'Bed time', 'member_routine_time', 'pending', NULL, NULL, NULL,
         'now', 'now');
    `);
    database.exec(
      readFileSync(
        fileURLToPath(new URL('./0021_routine_time_of_day.sql', import.meta.url)),
        'utf8',
      ),
    );

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 21').get()).toEqual(
      { name: 'routine_time_of_day' },
    );
    expect(
      database.prepare('SELECT id, routine_label FROM chore_templates ORDER BY id').all(),
    ).toEqual([
      { id: 'template_dinner', routine_label: 'Evening' },
      { id: 'template_extra', routine_label: 'Anytime' },
      { id: 'template_school', routine_label: 'Morning' },
    ]);
    expect(
      database
        .prepare('SELECT id, routine_label_snapshot FROM chore_occurrences ORDER BY id')
        .all(),
    ).toEqual([
      { id: 'occurrence_bed', routine_label_snapshot: 'Bedtime' },
      { id: 'occurrence_school', routine_label_snapshot: 'Morning' },
    ]);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    database.close();
  });

  it('retires the external reminder bridge and adds household-owned reminders', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hearth-migration-'));
    temporaryDirectories.push(directory);
    const database = new Database(join(directory, 'hearth.sqlite'));
    applyMigrations(database);

    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 25').get()).toEqual(
      { name: 'reminder_source_projection' },
    );
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 26').get()).toEqual(
      { name: 'today_reminders' },
    );
    expect(database.prepare('SELECT name FROM schema_migrations WHERE version = 27').get()).toEqual(
      { name: 'native_reminders' },
    );
    expect(
      database.prepare('PRAGMA table_info(hearth_reminders)').all() as Array<{ name: string }>,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'household_id' }),
        expect.objectContaining({ name: 'list_id' }),
        expect.objectContaining({ name: 'title' }),
        expect.objectContaining({ name: 'due_local_date' }),
        expect.objectContaining({ name: 'has_due_time' }),
        expect.objectContaining({ name: 'is_completed' }),
        expect.objectContaining({ name: 'deleted_at' }),
      ]),
    );
    for (const retiredTable of [
      'reminder_sources',
      'reminder_source_devices',
      'reminder_source_pairing_requests',
      'reminder_lists',
      'reminder_items',
      'reminder_snapshot_receipts',
    ]) {
      expect(
        database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get(retiredTable),
      ).toBeUndefined();
    }

    database.exec(`
      INSERT INTO households VALUES ('household_reminder', 'Home', 'Australia/Perth', 'en-AU', 1, 'now', 'now');
      INSERT INTO today_section_preferences
        (household_id, show_dinner, show_list_summary, show_notice, show_photo,
         show_daily_verse, updated_at)
      VALUES ('household_reminder', 1, 1, 1, 1, 0, 'now');
      INSERT INTO hearth_reminder_lists
        (id, household_id, title, created_at, updated_at, archived_at)
      VALUES ('reminder_list_one', 'household_reminder', 'Reminders', 'now', 'now', NULL);
      INSERT INTO hearth_reminders
        (id, household_id, list_id, title, due_local_date, due_at, has_due_time,
         is_completed, completed_at, created_at, updated_at, deleted_at)
      VALUES ('reminder_one', 'household_reminder', 'reminder_list_one', 'Bins', NULL, NULL,
              0, 0, NULL, 'now', 'now', NULL);
    `);
    expect(
      database
        .prepare('SELECT show_reminders FROM today_section_preferences WHERE household_id = ?')
        .get('household_reminder'),
    ).toEqual({ show_reminders: 1 });
    expect(() =>
      database
        .prepare('UPDATE today_section_preferences SET show_reminders = 2 WHERE household_id = ?')
        .run('household_reminder'),
    ).toThrow(/CHECK/);
    expect(() =>
      database
        .prepare(
          `UPDATE hearth_reminders
           SET has_due_time = 1
           WHERE id = 'reminder_one'`,
        )
        .run(),
    ).toThrow(/CHECK/);
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
    database.close();
  });
});

it('0037 adds an empty demonstration library without rewriting Fitness plans, checks or receipts', () => {
  const db = new Database(':memory:');
  try {
    for (const file of readdirSync(fileURLToPath(new URL('.', import.meta.url)))
      .filter((file) => /^\d{4}_.*\.sql$/.test(file) && Number(file.slice(0, 4)) <= 36)
      .sort())
      db.exec(readFileSync(new URL(file, import.meta.url), 'utf8'));
    db.exec(`INSERT INTO households VALUES ('household_kept','Kept','Australia/Perth','en-AU',1,'now','now');
      INSERT INTO fitness_plans VALUES ('household_kept','2026-11-04',1,'{"selectedMemberIds":[],"plans":[]}');
      INSERT INTO fitness_progress VALUES ('household_kept','2026-11-04','member_kept','workout_kept',1,2,'now');
      INSERT INTO fitness_receipts VALUES ('household_kept','member:kept','request_kept','unchanged-hash','{}');`);
    const before = ['fitness_plans', 'fitness_progress', 'fitness_receipts'].map((table) =>
      db.prepare(`SELECT * FROM ${table}`).all(),
    );
    applyMigrations(db);
    expect(
      ['fitness_plans', 'fitness_progress', 'fitness_receipts'].map((table) =>
        db.prepare(`SELECT * FROM ${table}`).all(),
      ),
    ).toEqual(before);
    for (const table of [
      'fitness_exercise_library',
      'fitness_library_receipts',
      'fitness_library_retired',
    ])
      expect(db.prepare(`SELECT count(*) n FROM ${table}`).get()).toEqual({ n: 0 });
    expect(db.prepare('SELECT max(version) n FROM schema_migrations').get()).toEqual({ n: 37 });
  } finally {
    db.close();
  }
});
