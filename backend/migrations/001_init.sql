-- Sweety initial schema
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glucose_readings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date  DATE NOT NULL,
  time_slot     VARCHAR(30) NOT NULL,
  glucose_value INTEGER NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT glucose_value_range CHECK (glucose_value BETWEEN 40 AND 600),
  CONSTRAINT time_slot_allowed CHECK (time_slot IN ('MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER')),
  -- One reading per slot per user per date. Together with the 4-value time_slot CHECK
  -- this also guarantees at most four readings per user per date at the database level.
  CONSTRAINT one_reading_per_slot_per_day UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_id ON glucose_readings (user_id);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_reading_date ON glucose_readings (reading_date);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_date ON glucose_readings (user_id, reading_date);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_glucose_readings_updated_at ON glucose_readings;
CREATE TRIGGER trg_glucose_readings_updated_at BEFORE UPDATE ON glucose_readings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
