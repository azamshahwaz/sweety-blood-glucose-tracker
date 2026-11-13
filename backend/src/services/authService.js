
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4);

// -------------------- VALIDATION HELPERS --------------------

function validateRegistration({ name, email, password, confirmPassword }) {

  // Name validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'Name is required.', {
      name: 'Name is required.'
    });
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2 || trimmedName.length > 100 ||
      !/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(trimmedName)) {
    throw new AppError(400, 'Please enter a valid name.', {
      name: 'Name must contain 4-100 characters and only letters, spaces, hyphens or apostrophes.'
    });
  }

  // Email validation
if (!email || typeof email !== 'string') {
  throw new AppError(400, 'Email is required.', {
    email: 'Email is required.'
  });
}

const normalizedEmail = email.trim().toLowerCase();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(normalizedEmail)) {
  throw new AppError(400, 'Please enter a valid email address.', {
    email: 'Please enter a valid email address.'
  });
}

  // Password validation
  if (!password || typeof password !== 'string') {
    throw new AppError(400, 'Password is required.', {
      password: 'Password is required.'
    });
  }

  const passwordErrors = [];

  if (password.length < 8) {
    passwordErrors.push('Password must be at least 8 characters long.');
  }

  if (!/[A-Z]/.test(password)) {
    passwordErrors.push('Password must contain at least one uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    passwordErrors.push('Password must contain at least one lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    passwordErrors.push('Password must contain at least one number.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    passwordErrors.push('Password must contain at least one special character.');
  }

  if (passwordErrors.length > 0) {
    throw new AppError(400, 'Password does not meet the requirements.', {
      password: passwordErrors.join(' ')
    });
  }

  // Confirm password validation
  if (!confirmPassword || typeof confirmPassword !== 'string') {
    throw new AppError(400, 'Please confirm your password.', {
      confirmPassword: 'Confirm password is required.'
    });
  }

  if (password !== confirmPassword) {
    throw new AppError(400, 'Passwords do not match.', {
      confirmPassword: 'Passwords do not match. Please enter the same password.'
    });
  }

  return {
    name: trimmedName,
    email: normalizedEmail
  };
}

// -------------------- SAFE USER --------------------

const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  created_at: u.created_at
});

// -------------------- REGISTER --------------------

async function register({ name, email, password, confirmPassword }) {

  // Validate all registration fields
  const validated = validateRegistration({
    name,
    email,
    password,
    confirmPassword
  });

  // Hash password
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  try {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [validated.name, validated.email, passwordHash]
    );

    return safeUser(rows[0]);

  } catch (err) {

    if (err.code === '23505') {
      throw new AppError(
        409,
        'An account with this email already exists.',
        {
          email: 'An account with this email already exists.'
        }
      );
    }

    throw err;
  }
}

// -------------------- LOGIN --------------------

async function login({ email, password }) {

  if (!email || typeof email !== 'string') {
    throw new AppError(400, 'Email is required.', {
      email: 'Email is required.'
    });
  }

  if (!password || typeof password !== 'string') {
    throw new AppError(400, 'Password is required.', {
      password: 'Password is required.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [normalizedEmail]
  );

  const user = rows[0];

  // Dummy comparison prevents an obvious timing difference
  // when an account does not exist.
  const ok = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH
  );

  if (!user || !ok) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const token = jwt.sign(
    { sub: user.id },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      algorithm: 'HS256'
    }
  );

  const { exp } = jwt.decode(token);

  return {
    user: safeUser(user),
    token,
    maxAgeMs: exp * 1000 - Date.now()
  };
}

module.exports = {
  register,
  login
};
