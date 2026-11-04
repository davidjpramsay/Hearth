BEGIN IMMEDIATE;
CREATE TABLE household_modules_v36 (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL CHECK (module_id IN ('calendar','weather','reminders','chores','lists','meals','home','photos','games','notices','dailyVerse','nba','morningRoutine','fitness')),
  enabled INTEGER NOT NULL CHECK (enabled IN (0,1)), updated_at TEXT NOT NULL,
  PRIMARY KEY (household_id,module_id)
);
INSERT INTO household_modules_v36 SELECT * FROM household_modules;
DROP TABLE household_modules;
ALTER TABLE household_modules_v36 RENAME TO household_modules;
CREATE TABLE fitness_plans (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL, revision INTEGER NOT NULL CHECK (revision>0),
  configuration_json TEXT NOT NULL CHECK (json_valid(configuration_json)),
  PRIMARY KEY (household_id,effective_from)
);
CREATE TABLE fitness_progress (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  local_date TEXT NOT NULL, member_id TEXT NOT NULL, workout_id TEXT NOT NULL,
  completed INTEGER NOT NULL CHECK (completed IN (0,1)), version INTEGER NOT NULL CHECK (version>0),
  updated_at TEXT NOT NULL, PRIMARY KEY (household_id,local_date,member_id,workout_id)
);
CREATE TABLE fitness_receipts (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  actor_scope TEXT NOT NULL, request_id TEXT NOT NULL, input_hash TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  PRIMARY KEY (household_id,actor_scope,request_id)
);
INSERT INTO schema_migrations(version,name,applied_at) VALUES (36,'fitness',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
COMMIT;
