CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT one_reminder_per_user_per_day UNIQUE (user_id, reminder_date)
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_reminder_date ON reminder_logs (reminder_date);
