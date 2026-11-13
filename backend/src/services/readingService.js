const db = require('../config/db');
const AppError = require('../utils/AppError');
const { lastOfMonth } = require('../utils/dates');
const { TIME_SLOTS, SLOT_LABELS, SLOT_ORDER_SQL, MAX_READINGS_PER_DAY } = require('../utils/constants');
const { withInterpretation } = require('./glucoseInterpretation');

const COLUMNS = 'id, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes, created_at, updated_at';
const MAX_MSG = `You can add only ${MAX_READINGS_PER_DAY} readings per day.`;
const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');
const dupMsg = (slot) => `You already have ${article(SLOT_LABELS[slot])} ${SLOT_LABELS[slot]} reading for this date.`;

// Takes a per-user lock inside a transaction so concurrent requests for the same user are
// serialized and can never push a day past the 4-reading limit.
async function lockUser(client, userId) {
  await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
}

async function assertSlotAvailable(client, userId, date, slot, excludeId) {
  const { rows } = await client.query(
    'SELECT time_slot FROM glucose_readings WHERE user_id = $1 AND reading_date = $2 AND ($3::uuid IS NULL OR id <> $3::uuid)',
    [userId, date, excludeId || null]
  );
  if (rows.length >= MAX_READINGS_PER_DAY) throw new AppError(409, MAX_MSG, { reading_date: MAX_MSG });
  if (rows.some((r) => r.time_slot === slot)) throw new AppError(409, dupMsg(slot), { time_slot: dupMsg(slot) });
}

function mapUniqueViolation(err, slot) {
  if (err.code === '23505') return new AppError(409, dupMsg(slot), { time_slot: dupMsg(slot) });
  return err;
}

async function create(userId, { reading_date, time_slot, glucose_value, fasting_confirmed = null, meal_timing_minutes = null }) {
  try {
    return await db.withTransaction(async (client) => {
      await lockUser(client, userId);
      await assertSlotAvailable(client, userId, reading_date, time_slot, null);
      const { rows } = await client.query(
        `INSERT INTO glucose_readings (user_id, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
        [userId, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes]
      );
      return withInterpretation(rows[0]);
    });
  } catch (err) {
    throw mapUniqueViolation(err, time_slot);
  }
}

async function getById(userId, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM glucose_readings WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (!rows[0]) throw new AppError(404, 'Reading not found.');
  return withInterpretation(rows[0]);
}

async function update(userId, id, { reading_date, time_slot, glucose_value, fasting_confirmed = null, meal_timing_minutes = null }) {
  try {
    return await db.withTransaction(async (client) => {
      await lockUser(client, userId);
      const existing = await client.query('SELECT id FROM glucose_readings WHERE id = $1 AND user_id = $2', [id, userId]);
      if (!existing.rows[0]) throw new AppError(404, 'Reading not found.');
      await assertSlotAvailable(client, userId, reading_date, time_slot, id);
      const { rows } = await client.query(
        `UPDATE glucose_readings SET reading_date = $3, time_slot = $4, glucose_value = $5,
          fasting_confirmed = $6, meal_timing_minutes = $7
         WHERE id = $1 AND user_id = $2 RETURNING ${COLUMNS}`,
        [id, userId, reading_date, time_slot, glucose_value, fasting_confirmed, meal_timing_minutes]
      );
      return withInterpretation(rows[0]);
    });
  } catch (err) {
    throw mapUniqueViolation(err, time_slot);
  }
}

async function remove(userId, id) {
  const { rowCount } = await db.query('DELETE FROM glucose_readings WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!rowCount) throw new AppError(404, 'Reading not found.');
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

async function list(userId, { month, date, search, page, limit }) {
  const params = [userId];
  const where = ['user_id = $1'];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };

  if (date) add('reading_date = ?', date);
  if (month) {
    add('reading_date >= ?', `${month}-01`);
    add('reading_date <= ?', lastOfMonth(month));
  }
  if (search) {
    const term = search.toLowerCase();
    const slots = TIME_SLOTS.filter(
      (s) => SLOT_LABELS[s].toLowerCase().includes(term) || s.toLowerCase().replace(/_/g, ' ').includes(term) || (term.includes('fasting') && s === 'MORNING_FASTING')
    );
    params.push(`%${escapeLike(search)}%`);
    const likeIdx = params.length;
    params.push(slots);
    where.push(
      `(to_char(reading_date, 'YYYY-MM-DD') ILIKE $${likeIdx} OR to_char(reading_date, 'DD Mon YYYY') ILIKE $${likeIdx} OR time_slot = ANY($${params.length}::text[]))`
    );
  }

  const whereSql = where.join(' AND ');
  const offset = (page - 1) * limit;
  const [countRes, rowsRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total FROM glucose_readings WHERE ${whereSql}`, params),
    db.query(
      `SELECT ${COLUMNS} FROM glucose_readings WHERE ${whereSql}
       ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} ASC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ),
  ]);
  const total = countRes.rows[0].total;
  return { readings: rowsRes.rows.map(withInterpretation), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

module.exports = { create, getById, update, remove, list };
