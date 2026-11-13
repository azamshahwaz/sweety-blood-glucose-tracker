const db = require('../config/db');
const env = require('../config/env');
const { cacheRead, cacheWrite } = require('./redisClient');

async function cachedReport(userId, type, period, loader) {
  const { rows } = await db.query('SELECT report_cache_version FROM users WHERE id = $1', [userId]);
  const version = rows[0]?.report_cache_version ?? 0;
  const key = `report:user:${userId}:v${version}:${type}:${period}`;
  let cached = null;
  try { cached = await cacheRead(key); } catch { /* Treat cache errors as misses. */ }
  if (cached !== null) return cached;
  const value = await loader();
  try { await cacheWrite(key, value, env.reportCacheTtlSeconds); } catch { /* PostgreSQL response still succeeds. */ }
  return value;
}

module.exports = { cachedReport };
