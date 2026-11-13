const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool } = require('../src/config/db');
const { migrate } = require('../migrations/run');
const { TIME_SLOTS } = require('../src/utils/constants');
const { todayInTimezone, previousMonthRange } = require('../src/utils/dates');

const DEMO = { name: 'Sweety Demo', email: 'demo@sweety.app', password: 'SweetyDemo@123' };
const DEMO_DOCTOR = { name: 'Demo Doctor', email: 'doctor@sweety.app', password: 'SweetyDoctor@123' };
const BASE = { MORNING_FASTING: 100, AFTER_BREAKFAST: 140, AFTER_LUNCH: 135, AFTER_DINNER: 145 };

// Deterministic pseudo-random generator so the seed is repeatable.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function* datesBetween(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const end = Date.UTC(ty, tm - 1, td);
  for (let t = Date.UTC(fy, fm - 1, fd); t <= end; t += 86400000) yield new Date(t).toISOString().slice(0, 10);
}

async function seed() {
  await migrate();
  const today = todayInTimezone(env.timeZone);
  const { from } = previousMonthRange(today);
  const rand = rng(2026);

  const patientHash = await bcrypt.hash(DEMO.password, env.bcryptRounds);
  await pool.query(`INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT(email) DO NOTHING`, [DEMO.name, DEMO.email, patientHash]);
  const patientRes = await pool.query("SELECT id,role FROM users WHERE email=$1", [DEMO.email]);
  if (patientRes.rows[0].role !== 'PATIENT') throw new Error('Demo patient email already belongs to a non-patient account; no data was changed.');
  const userId = patientRes.rows[0].id;
  const doctorHash = await bcrypt.hash(DEMO_DOCTOR.password, env.bcryptRounds);
  await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'DOCTOR') ON CONFLICT(email) DO NOTHING", [DEMO_DOCTOR.name, DEMO_DOCTOR.email, doctorHash]);
  const doctorRes = await pool.query("SELECT id,role FROM users WHERE email=$1", [DEMO_DOCTOR.email]);
  if (doctorRes.rows[0].role !== 'DOCTOR') throw new Error('Demo doctor email already belongs to a non-doctor account; no data was changed.');
  await pool.query('INSERT INTO doctor_patient_assignments(doctor_id,patient_id) VALUES($1,$2) ON CONFLICT(doctor_id,patient_id) DO NOTHING', [doctorRes.rows[0].id, userId]);

  let inserted = 0;
  let i = 0;
  for (const date of datesBetween(from, today)) {
    const slots = i % 3 === 0 ? TIME_SLOTS : TIME_SLOTS.filter(() => rand() > 0.3);
    i += 1;
    for (const slot of slots) {
      const value = Math.round(BASE[slot] + (rand() - 0.4) * 70);
      const res = await pool.query(
        `INSERT INTO glucose_readings (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
        [userId, date, slot, Math.min(600, Math.max(40, value))]
      );
      inserted += res.rowCount;
    }
  }
  if (inserted > 0) await pool.query('UPDATE users SET report_cache_version = report_cache_version + 1 WHERE id = $1', [userId]);
  console.log(`Seed complete. Demo patient: ${DEMO.email}; demo doctor: ${DEMO_DOCTOR.email}; new readings inserted: ${inserted}`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
