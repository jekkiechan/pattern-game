CREATE TABLE IF NOT EXISTS trainer_progress (
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 slot text NOT NULL CHECK (slot IN ('beybattleLeague','patternTrainerJourney','climberSkybound')),
 data jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, slot)
);
ALTER TABLE trainer_progress DROP CONSTRAINT IF EXISTS trainer_progress_slot_check;
ALTER TABLE trainer_progress ADD CONSTRAINT trainer_progress_slot_check
 CHECK (slot IN ('beybattleLeague','patternTrainerJourney','climberSkybound'));
CREATE TABLE IF NOT EXISTS trainer_recovery (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 code_hash text NOT NULL
);
CREATE TABLE IF NOT EXISTS trainer_throttle (
 key text PRIMARY KEY,
 count integer NOT NULL,
 expires_at timestamptz NOT NULL
);
