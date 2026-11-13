-- Reference schema for a fresh Sweety database. Prefer the tracked migrations in backend/migrations.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'PATIENT' CHECK (role IN ('PATIENT','DOCTOR','ADMIN')),
  report_cache_version BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glucose_readings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date  DATE NOT NULL,
  time_slot     VARCHAR(30) NOT NULL,
  glucose_value INTEGER NOT NULL,
  fasting_confirmed BOOLEAN,
  meal_timing_minutes INTEGER CHECK (meal_timing_minutes IS NULL OR meal_timing_minutes BETWEEN 0 AND 1440),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT glucose_value_range CHECK (glucose_value BETWEEN 40 AND 600),
  CONSTRAINT time_slot_allowed CHECK (time_slot IN ('MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER')),
  -- One reading per slot per user per date. Together with the 4-value time_slot CHECK
  -- this also guarantees at most four readings per user per date at the database level.
  CONSTRAINT one_reading_per_slot_per_day UNIQUE (user_id, reading_date, time_slot)
);

CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT one_reminder_per_user_per_day UNIQUE (user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_date ON reminder_logs (reminder_date);

CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_id ON glucose_readings (user_id);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_reading_date ON glucose_readings (reading_date);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_date ON glucose_readings (user_id, reading_date);

CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT doctor_patient_not_self CHECK (doctor_id <> patient_id),
  CONSTRAINT doctor_patient_unique UNIQUE (doctor_id, patient_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_doctor ON doctor_patient_assignments (doctor_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_patient ON doctor_patient_assignments (patient_id);

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
