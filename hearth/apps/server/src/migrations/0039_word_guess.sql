BEGIN IMMEDIATE;
ALTER TABLE household_game_modules RENAME TO household_game_modules_v38;
CREATE TABLE household_game_modules (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL CHECK(module_id IN ('connections','connectFour','wordGuess')),
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(household_id,module_id)
);
INSERT INTO household_game_modules SELECT * FROM household_game_modules_v38;
DROP TABLE household_game_modules_v38;
INSERT INTO schema_migrations (version,name,applied_at) VALUES (39,'word_guess','2026-11-05T00:00:00.000Z');
COMMIT;
