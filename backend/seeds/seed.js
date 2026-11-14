
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool } = require('../src/config/db');
const { migrate } = require('../migrations/run');
const { TIME_SLOTS } = require('../src/utils/constants');
const { todayInTimezone, previousMonthRange } = require('../src/utils/dates');

// Demo accounts
const DEMO = {
  name: 'Sweety Demo',
  email: 'demo@sweety.app',
  password: 'SweetyDemo@123',
  role: 'PATIENT',
};

const DEMO_DOCTOR = {
  name: 'Demo Doctor',
  email: 'nisha.doctor@sweety.app',
  password: 'NishaDoctor@19',
  role: 'DOCTOR',
};

const DEMO_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@sweety.app',
  password: 'AzamAdmin@1926',
  role: 'ADMIN',
};

const BASE = {
  MORNING_FASTING: 100,
  AFTER_BREAKFAST: 140,
  AFTER_LUNCH: 135,
  AFTER_DINNER: 145,
};

// Deterministic pseudo-random generator
function rng(seed) {
  let s = seed;

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Generate dates between two dates (inclusive)
function* datesBetween(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);

  const end = Date.UTC(ty, tm - 1, td);

  for (
    let t = Date.UTC(fy, fm - 1, fd);
    t <= end;
    t += 86400000
  ) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}

// Create demo account without modifying existing accounts
async function createDemoAccount(account) {
  const passwordHash = await bcrypt.hash(
    account.password,
    env.bcryptRounds
  );

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [
      account.name,
      account.email,
      passwordHash,
      account.role,
    ]
  );

  const result = await pool.query(
    `SELECT id, name, email, role
     FROM users
     WHERE email = $1`,
    [account.email]
  );

  if (!result.rows.length) {
    throw new Error(
      `Unable to create or find demo account: ${account.email}`
    );
  }

  const user = result.rows[0];

  if (user.role !== account.role) {
    throw new Error(
      `Role mismatch for ${account.email}. Expected ${account.role}, found ${user.role}.`
    );
  }

  return user;
}

// Main seed function
async function seed() {
  try {
    await migrate();

    const today = todayInTimezone(env.timeZone);
    const { from } = previousMonthRange(today);
    const rand = rng(2026);

    // Create admin account
    const admin = await createDemoAccount(DEMO_ADMIN);

    // Create patient account
    const patient = await createDemoAccount(DEMO);

    // Create doctor account
    const doctor = await createDemoAccount(DEMO_DOCTOR);

    // Assign patient to doctor
    await pool.query(
      `INSERT INTO doctor_patient_assignments
       (doctor_id, patient_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
      [doctor.id, patient.id]
    );

    // Insert sample glucose readings
    let inserted = 0;
    let i = 0;

    for (const date of datesBetween(from, today)) {
      const slots =
        i % 3 === 0
          ? TIME_SLOTS
          : TIME_SLOTS.filter(() => rand() > 0.3);

      i += 1;

      for (const slot of slots) {
        const value = Math.round(
          BASE[slot] + (rand() - 0.4) * 70
        );

        const result = await pool.query(
          `INSERT INTO glucose_readings
           (user_id, reading_date, time_slot, glucose_value)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, reading_date, time_slot)
           DO NOTHING`,
          [
            patient.id,
            date,
            slot,
            Math.min(600, Math.max(40, value)),
          ]
        );

        inserted += result.rowCount;
      }
    }

    // Invalidate patient's report cache when readings are inserted
    if (inserted > 0) {
      await pool.query(
        `UPDATE users
         SET report_cache_version = report_cache_version + 1
         WHERE id = $1`,
        [patient.id]
      );
    }

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
