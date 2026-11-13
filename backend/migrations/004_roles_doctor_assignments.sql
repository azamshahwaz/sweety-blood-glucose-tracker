ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'PATIENT';
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_cache_version BIGINT NOT NULL DEFAULT 0;
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_allowed CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
