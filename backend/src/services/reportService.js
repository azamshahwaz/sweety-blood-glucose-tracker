const db = require('../config/db');
const { firstOfMonth, previousMonthRange } = require('../utils/dates');
const { SLOT_ORDER_SQL } = require('../utils/constants');
const { withInterpretation } = require('./glucoseInterpretation');
const { cachedReport } = require('./reportCache');

// Aggregates computed in PostgreSQL. AVG is rounded to 1 decimal; zero rows => nulls (no division errors).
async function getStats(userId, from, to) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
            MAX(glucose_value)::int AS highest,
            MIN(glucose_value)::int AS lowest,
            ROUND(AVG(glucose_value)::numeric, 1)::float AS average
       FROM glucose_readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  return rows[0];
}

async function getDailyAverages(userId, from, to) {
  const { rows } = await db.query(
    `SELECT reading_date AS date,
            ROUND(AVG(glucose_value)::numeric, 1)::float AS average,
            MIN(glucose_value)::int AS lowest,
            MAX(glucose_value)::int AS highest,
            COUNT(*)::int AS count
       FROM glucose_readings
      WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
      GROUP BY reading_date ORDER BY reading_date`,
    [userId, from, to]
  );
  return rows;
}

async function rangeReport(userId, from, to) {
  const [stats, dailyAverages] = await Promise.all([getStats(userId, from, to), getDailyAverages(userId, from, to)]);
  return { range: { from, to }, stats, dailyAverages, isEmpty: stats.total === 0 };
}

async function daily(userId, date) {
  return cachedReport(userId, 'daily', date, async () => {
    const { rows } = await db.query(
      `SELECT id, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes FROM glucose_readings
      WHERE user_id = $1 AND reading_date = $2 ORDER BY ${SLOT_ORDER_SQL}`,
      [userId, date]
    );
    const stats = await getStats(userId, date, date);
    return { range: { from: date, to: date }, stats, readings: rows.map(withInterpretation), isEmpty: stats.total === 0 };
  });
}

const monthToDate = (userId, date) => cachedReport(userId, 'mtd', date, () => rangeReport(userId, firstOfMonth(date), date));

function previousMonth(userId, date) {
  const { from, to } = previousMonthRange(date);
  return cachedReport(userId, 'monthly', from.slice(0, 7), () => rangeReport(userId, from, to));
}

module.exports = { getStats, daily, monthToDate, previousMonth };
