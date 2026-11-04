BEGIN IMMEDIATE;
CREATE TABLE fitness_exercise_library (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  entry_json TEXT NOT NULL CHECK (json_valid(entry_json)),
  PRIMARY KEY (household_id,exercise_id)
);
CREATE TABLE fitness_library_retired (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL, PRIMARY KEY (household_id,exercise_id)
);
CREATE TABLE fitness_library_receipts (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  actor_scope TEXT NOT NULL, request_id TEXT NOT NULL, input_hash TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  PRIMARY KEY (household_id,actor_scope,request_id)
);
INSERT INTO schema_migrations(version,name,applied_at) VALUES (37,'fitness_exercise_library',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
COMMIT;
