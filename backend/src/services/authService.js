
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4);

function validateRegistration({ name, email, password, confirmPassword }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'Name is required.', {
      name: 'Name is required.',
    });
  }

  const trimmedName = name.trim();

  if (
    trimmedName.length < 2 ||
    trimmedName.length > 100 ||
    !/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(trimmedName)
  ) {
    throw new AppError(400, 'Please enter a valid name.', {
      name: 'Name must contain 2-100 characters and only letters, spaces, hyphens or apostrophes.',
    });
  }

  if (!email || typeof email !== 'string') {
    throw new AppError(400, 'Email is required.', {
      email: 'Email is required.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError(400, 'Please enter a valid email address.', {
      email: 'Please enter a valid email address.',
    });
  }

  if (!password || typeof password !== 'string') {
    throw new AppError(400, 'Password is required.', {
      password: 'Password is required.',
    });
  }

  const passwordErrors = [];

  if (password.length < 8) passwordErrors.push('Password must be at least 8 characters long.');
  if (!/[A-Z]/.test(password)) passwordErrors.push('Password must contain at least one uppercase letter.');
  if (!/[a-z]/.test(password)) passwordErrors.push('Password must contain at least one lowercase letter.');
  if (!/[0-9]/.test(password)) passwordErrors.push('Password must contain at least one number.');
  if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('Password must contain at least one special character.');

  if (passwordErrors.length) {
    throw new AppError(400, 'Password does not meet the requirements.', {
      password: passwordErrors.join(' '),
    });
  }

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    throw new AppError(400, 'Please confirm your password.', {
      confirmPassword: 'Confirm password is required.',
    });
  }

  if (password !== confirmPassword) {
    throw new AppError(400, 'Passwords do not match.', {
      confirmPassword: 'Passwords do not match.',
    });
  }

  return {
    name: trimmedName,
    email: normalizedEmail,
  };
}

const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role || 'PATIENT',
  created_at: u.created_at,
});

async function register({ name, email, password, confirmPassword }) {
  const validated = validateRegistration({
    name,
    email,
    password,
    confirmPassword,
  });

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  try {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [validated.name, validated.email, passwordHash]
    );

    return safeUser(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'An account with this email already exists.', {
        email: 'An account with this email already exists.',
      });
    }

    throw err;
  }
}

async function login({ email, password }) {
  if (!email || typeof email !== 'string') {
    throw new AppError(400, 'Email is required.', {
      email: 'Email is required.',
    });
  }

  if (!password || typeof password !== 'string') {
    throw new AppError(400, 'Password is required.', {
      password: 'Password is required.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );

  const user = rows[0];

  const ok = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH
  );

  if (!user || !ok) {
    throw new AppError(401, 'Invalid email or password.');
  }

  // Every tab receives its own independent server-side session ID.
  const sessionId = randomUUID();

  const token = jwt.sign(
    {
      sub: user.id,
      sid: sessionId,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      algorithm: 'HS256',
    }
  );

  const decoded = jwt.decode(token);

  if (!decoded?.exp) {
    throw new AppError(500, 'Could not create an authentication session.');
  }

  const expiresAt = new Date(decoded.exp * 1000);
  const maxAgeMs = Math.max(0, expiresAt.getTime() - Date.now());

  await db.query(
    `INSERT INTO tab_sessions (id, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [sessionId, user.id, expiresAt]
  );

  return {
    user: safeUser(user),
    token,
    maxAgeMs,
  };
}

async function logout(sessionId, userId) {
  if (!sessionId || !userId) return;

  await db.query(
    `UPDATE tab_sessions
     SET revoked_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND revoked_at IS NULL`,
    [sessionId, userId]
  );
}

module.exports = {
  register,
  login,
  logout,
};
