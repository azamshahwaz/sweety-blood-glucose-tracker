
const db = require('../config/db');

// Create one daily reminder for patients who have fewer than 4 readings.
async function createMissingReadingReminders(reminderDate) {
  const { rowCount } = await db.query(
    `INSERT INTO reminder_logs (user_id, reminder_date)
     SELECT u.id, $1::date
     FROM users u
     LEFT JOIN glucose_readings r
       ON r.user_id = u.id
       AND r.reading_date = $1::date
     WHERE u.role = 'PATIENT'
     GROUP BY u.id
     HAVING COUNT(r.id) < 4
     ON CONFLICT (user_id, reminder_date) DO NOTHING`,
    [reminderDate]
  );

  return rowCount;
}

// Fetch notifications belonging only to the logged-in patient.
async function getNotifications(userId) {
  const { rows } = await db.query(
    `SELECT
       id,
       reminder_date,
       created_at,
       read_at
     FROM reminder_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );

  const unreadResult = await db.query(
    `SELECT COUNT(*)::int AS unread_count
     FROM reminder_logs
     WHERE user_id = $1
       AND read_at IS NULL`,
    [userId]
  );

  return {
    notifications: rows,
    unreadCount: unreadResult.rows[0].unread_count,
  };
}

// Mark one notification as read.
async function markNotificationRead(userId, notificationId) {
  const { rows } = await db.query(
    `UPDATE reminder_logs
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1
       AND user_id = $2
     RETURNING id, reminder_date, created_at, read_at`,
    [notificationId, userId]
  );

  return rows[0] || null;
}

// Mark all notifications as read.
async function markAllNotificationsRead(userId) {
  const { rowCount } = await db.query(
    `UPDATE reminder_logs
     SET read_at = NOW()
     WHERE user_id = $1
       AND read_at IS NULL`,
    [userId]
  );

  return rowCount;
}

module.exports = {
  createMissingReadingReminders,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
