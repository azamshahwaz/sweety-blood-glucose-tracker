const path = require('path');
const dotenv = require('dotenv');

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isProduction = nodeEnv === 'production';

// Tests load .env.test ONLY, so they can never pick up development credentials.
dotenv.config({ path: path.resolve(__dirname, '../../', isTest ? '.env.test' : '.env') });

function databaseName(url) {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

const databaseUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(isTest ? 'TEST_DATABASE_URL is required to run tests (see .env.test.example).' : 'DATABASE_URL is required.');
}

if (isTest) {
  // Safety guard: refuse to run tests against anything that is not clearly a test database.
  if (!databaseName(databaseUrl).endsWith('_test')) {
    throw new Error('Refusing to run tests: the TEST_DATABASE_URL database name must end with "_test".');
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === databaseUrl) {
    throw new Error('Refusing to run tests: TEST_DATABASE_URL must differ from DATABASE_URL.');
  }
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required.');
if (isProduction && (jwtSecret.length < 32 || jwtSecret.startsWith('replace_with'))) {
  throw new Error('JWT_SECRET must be a long random value in production.');
}

module.exports = {
  nodeEnv,
  isTest,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  databaseUrl,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisTls: process.env.REDIS_TLS === 'true',
  reportCacheTtlSeconds: Math.max(1, Math.trunc(Number(process.env.REPORT_CACHE_TTL_SECONDS)) || 300),
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || '',
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || '',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5177')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
};
