
ALTER TABLE reminder_logs
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_unread
ON reminder_logs (user_id, created_at DESC)
WHERE read_at IS NULL;
