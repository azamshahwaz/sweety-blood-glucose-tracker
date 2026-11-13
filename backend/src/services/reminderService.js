const db = require('../config/db');

// Date is passed in by the worker after resolving the Asia/Kolkata calendar day.
async function createMissingReadingReminders(reminderDate) {
  const { rowCount } = await db.query(
    `INSERT INTO reminder_logs (user_id, reminder_date)
     SELECT u.id, $1::date
     FROM users u
     LEFT JOIN glucose_readings r
       ON r.user_id = u.id AND r.reading_date = $1::date
     GROUP BY u.id
     HAVING COUNT(r.id) < 4
     ON CONFLICT (user_id, reminder_date) DO NOTHING`,
    [reminderDate]
  );
  return rowCount;
}

module.exports = { createMissingReadingReminders };
