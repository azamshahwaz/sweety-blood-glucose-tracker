const db = require('../config/db');
const { getStats } = require('./reportService');
const { firstOfMonth, lastOfMonth } = require('../utils/dates');
const { TIME_SLOTS, SLOT_ORDER_SQL, MAX_READINGS_PER_DAY } = require('../utils/constants');
const { withInterpretation } = require('./glucoseInterpretation');

async function summary(userId, date, month) {
  const ym = month || date.slice(0, 7);
  const [stats, todayRes, recentRes] = await Promise.all([
    getStats(userId, firstOfMonth(ym), lastOfMonth(ym)),
    db.query('SELECT COUNT(*)::int AS count FROM glucose_readings WHERE user_id = $1 AND reading_date = $2', [userId, date]),
    db.query(
      `SELECT id, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes FROM glucose_readings
        WHERE user_id = $1 ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} DESC LIMIT 5`,
      [userId]
    ),
  ]);
  return {
    date,
    month: ym,
    today: { count: todayRes.rows[0].count, max: MAX_READINGS_PER_DAY },
    stats,
    recent: recentRes.rows.map(withInterpretation),
  };
}

async function trends(userId, month) {
  const from = firstOfMonth(month);
  const to = lastOfMonth(month);
  const [daily, slots] = await Promise.all([
    db.query(
      `SELECT reading_date AS date, ROUND(AVG(glucose_value)::numeric, 1)::float AS average,
              MIN(glucose_value)::int AS lowest, MAX(glucose_value)::int AS highest, COUNT(*)::int AS count
         FROM glucose_readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
        GROUP BY reading_date ORDER BY reading_date`,
      [userId, from, to]
    ),
    db.query(
      `SELECT time_slot, COUNT(*)::int AS count FROM glucose_readings
        WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3 GROUP BY time_slot`,
      [userId, from, to]
    ),
  ]);
  const counts = Object.fromEntries(slots.rows.map((r) => [r.time_slot, r.count]));
  return {
    month,
    dailyTrend: daily.rows,
    readingsPerDay: daily.rows.map((r) => ({ date: r.date, count: r.count })),
    slotCounts: TIME_SLOTS.map((s) => ({ time_slot: s, count: counts[s] || 0 })),
    totalReadings: daily.rows.reduce((sum, r) => sum + r.count, 0),
  };
}

module.exports = { summary, trends };
