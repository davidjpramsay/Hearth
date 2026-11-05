import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';

const migrations = [
  { version: 1, url: new URL('./migrations/0001_household_core.sql', import.meta.url) },
  { version: 2, url: new URL('./migrations/0002_admin_and_pairing.sql', import.meta.url) },
  { version: 3, url: new URL('./migrations/0003_chore_runtime.sql', import.meta.url) },
  { version: 4, url: new URL('./migrations/0004_calendar_projection.sql', import.meta.url) },
  { version: 5, url: new URL('./migrations/0005_household_planning.sql', import.meta.url) },
  { version: 6, url: new URL('./migrations/0006_home_assistant_projection.sql', import.meta.url) },
  { version: 7, url: new URL('./migrations/0007_tv_device_credentials.sql', import.meta.url) },
  { version: 8, url: new URL('./migrations/0008_photo_library.sql', import.meta.url) },
  { version: 9, url: new URL('./migrations/0009_pocket_money.sql', import.meta.url) },
  { version: 10, url: new URL('./migrations/0010_member_avatars.sql', import.meta.url) },
  { version: 11, url: new URL('./migrations/0011_calendar_connection_setup.sql', import.meta.url) },
  { version: 12, url: new URL('./migrations/0012_passkey_authentication.sql', import.meta.url) },
  {
    version: 13,
    url: new URL('./migrations/0013_notices_and_today_sections.sql', import.meta.url),
  },
  {
    version: 14,
    url: new URL('./migrations/0014_pocket_money_payment_history.sql', import.meta.url),
  },
  {
    version: 15,
    url: new URL('./migrations/0015_synology_photo_index.sql', import.meta.url),
  },
  {
    version: 16,
    url: new URL('./migrations/0016_meal_planning_polish.sql', import.meta.url),
  },
  {
    version: 17,
    url: new URL('./migrations/0017_chore_occurrence_management.sql', import.meta.url),
  },
  {
    version: 18,
    url: new URL('./migrations/0018_chore_windows_and_order.sql', import.meta.url),
  },
  {
    version: 19,
    url: new URL('./migrations/0019_home_assistant_connection_setup.sql', import.meta.url),
  },
  {
    version: 20,
    url: new URL('./migrations/0020_adult_access_recovery.sql', import.meta.url),
  },
  {
    version: 21,
    url: new URL('./migrations/0021_routine_time_of_day.sql', import.meta.url),
  },
  {
    version: 22,
    url: new URL('./migrations/0022_weather_location.sql', import.meta.url),
  },
  {
    version: 23,
    url: new URL('./migrations/0023_managed_photo_uploads.sql', import.meta.url),
  },
  {
    version: 24,
    url: new URL('./migrations/0024_daily_bible_verse.sql', import.meta.url),
  },
  {
    version: 25,
    url: new URL('./migrations/0025_reminder_source_projection.sql', import.meta.url),
  },
  {
    version: 26,
    url: new URL('./migrations/0026_today_reminders.sql', import.meta.url),
  },
  {
    version: 27,
    url: new URL('./migrations/0027_native_reminders.sql', import.meta.url),
  },
  {
    version: 28,
    url: new URL('./migrations/0028_controller_phone_connections.sql', import.meta.url),
  },
  {
    version: 29,
    url: new URL('./migrations/0029_phone_recovery.sql', import.meta.url),
  },
  { version: 30, url: new URL('./migrations/0030_home_assistant_bridge.sql', import.meta.url) },
  { version: 31, url: new URL('./migrations/0031_connection_codes.sql', import.meta.url) },
  { version: 32, url: new URL('./migrations/0032_household_modules.sql', import.meta.url) },
  { version: 33, url: new URL('./migrations/0033_nba_module.sql', import.meta.url) },
  { version: 34, url: new URL('./migrations/0034_morning_routine.sql', import.meta.url) },
  { version: 35, url: new URL('./migrations/0035_morning_routine_profiles.sql', import.meta.url) },
  { version: 36, url: new URL('./migrations/0036_fitness.sql', import.meta.url) },
  { version: 37, url: new URL('./migrations/0037_fitness_exercise_library.sql', import.meta.url) },
  { version: 38, url: new URL('./migrations/0038_game_modules.sql', import.meta.url) },
] as const;

const latestMigration = migrations.at(-1);
if (latestMigration === undefined) throw new Error('Hearth requires at least one migration.');
export const LATEST_MIGRATION_VERSION = latestMigration.version;

export async function openHearthDatabase(path: string): Promise<InstanceType<typeof Database>> {
  await mkdir(dirname(path), { recursive: true });
  const database = new Database(path);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  applyMigrations(database);
  return database;
}

export function applyMigrations(database: InstanceType<typeof Database>): void {
  const hasMigrationTable = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'")
    .get();
  const applied = new Set<number>();
  if (hasMigrationTable !== undefined) {
    const rows = database.prepare('SELECT version FROM schema_migrations').all() as {
      version: number;
    }[];
    for (const row of rows) applied.add(row.version);
  }

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    database.exec(readFileSync(fileURLToPath(migration.url), 'utf8'));
  }
}
