BEGIN IMMEDIATE;
CREATE TABLE household_modules_v40 (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL CHECK (module_id IN ('calendar','weather','reminders','chores','lists','meals','home','photos','games','notices','dailyVerse','nba','morningRoutine','fitness','afternoonRoutine')),
  enabled INTEGER NOT NULL CHECK (enabled IN (0,1)), updated_at TEXT NOT NULL,
  PRIMARY KEY (household_id,module_id)
);
INSERT INTO household_modules_v40 SELECT * FROM household_modules;
DROP TABLE household_modules;
ALTER TABLE household_modules_v40 RENAME TO household_modules;
CREATE TABLE afternoon_routine_settings (
 household_id TEXT PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL CHECK(revision>=1), configuration_json TEXT NOT NULL CHECK(json_valid(configuration_json))
);
CREATE TABLE afternoon_routine_progress (
 household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 local_date TEXT NOT NULL, profile_id TEXT NOT NULL CHECK(profile_id IN ('schoolDays','weekends')),
 member_id TEXT NOT NULL, step_id TEXT NOT NULL,
 completed INTEGER NOT NULL CHECK(completed IN (0,1)), version INTEGER NOT NULL CHECK(version>=1), updated_at TEXT NOT NULL,
 PRIMARY KEY(household_id,local_date,profile_id,member_id,step_id)
);
CREATE TABLE afternoon_routine_receipts (
 household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
 actor_scope TEXT NOT NULL, request_id TEXT NOT NULL, input_hash TEXT NOT NULL,
 result_json TEXT NOT NULL CHECK(json_valid(result_json)), PRIMARY KEY(household_id,actor_scope,request_id)
);
INSERT INTO schema_migrations(version,name,applied_at) VALUES(40,'afternoon_routine',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
COMMIT;
