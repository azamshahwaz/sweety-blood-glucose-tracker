const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4);
const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, created_at: u.created_at });

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    return safeUser(rows[0]);
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'An account with this email already exists.', { email: 'An account with this email already exists.' });
    throw err;
  }
}

async function login({ email, password }) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Compare against a dummy hash when the user is missing to keep timing similar.
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Invalid email or password.');
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' });
  const { exp } = jwt.decode(token);
  return { user: safeUser(user), token, maxAgeMs: exp * 1000 - Date.now() };
}

module.exports = { register, login };
