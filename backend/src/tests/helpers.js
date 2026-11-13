const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');
const { migrate } = require('../../migrations/run');

const ORIGIN = 'http://localhost:5173';
let counter = 0;

// Creates the schema in the TEST database only (env.js refuses non-"_test" databases).
async function setupDb() {
  await migrate();
}

// Safe cleanup: verifies we are connected to a "_test" database before truncating anything.
async function resetDb() {
  const { rows } = await pool.query('SELECT current_database() AS db');
  if (!rows[0].db.endsWith('_test')) throw new Error(`Refusing to truncate non-test database "${rows[0].db}"`);
  await pool.query('TRUNCATE glucose_readings, users RESTART IDENTITY CASCADE');
}

async function closeDb() {
  await pool.end();
}

const newAgent = () => request.agent(app).set('Origin', ORIGIN);

// Registers + logs in a fresh user. Returns a cookie-aware agent and the user.
async function createUser(overrides = {}) {
  counter += 1;
  const creds = {
    name: `Test User ${counter}`,
    email: `user${counter}@test.app`,
    password: 'Password@123',
    ...overrides,
  };
  const agent = newAgent();
  await agent.post('/api/auth/register').send({ ...creds, confirmPassword: creds.password }).expect(201);
  const login = await agent.post('/api/auth/login').send({ email: creds.email, password: creds.password }).expect(200);
  return { agent, user: login.body.data.user, creds };
}

// Direct inserts for report fixtures: rows are [date, slot, value].
async function insertReadings(userId, rows) {
  for (const [date, slot, value] of rows) {
    await pool.query('INSERT INTO glucose_readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1,$2,$3,$4)', [userId, date, slot, value]);
  }
}

module.exports = { request, app, pool, ORIGIN, setupDb, resetDb, closeDb, newAgent, createUser, insertReadings };
