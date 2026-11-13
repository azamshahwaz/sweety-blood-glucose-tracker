const Redis = require('ioredis');
const env = require('../config/env');

let client;
let outageLogged = false;
function getRedis() {
  if (!client) {
    client = new Redis({
      host: env.redisHost,
      port: env.redisPort,
      password: env.redisPassword || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });
    client.on('ready', () => { outageLogged = false; });
    client.on('error', () => {
      if (!env.isTest && !outageLogged) { outageLogged = true; console.warn('Redis unavailable; report cache bypassed.'); }
    });
  }
  return client;
}

async function cacheRead(key) {
  if (env.isTest) return null;
  try {
    const redis = getRedis();
    if (redis.status === 'wait') await redis.connect();
    const value = await redis.get(key);
    return value === null ? null : JSON.parse(value);
  } catch {
    return null;
  }
}

async function cacheWrite(key, value, ttlSeconds) {
  if (env.isTest) return;
  try {
    const redis = getRedis();
    if (redis.status === 'wait') await redis.connect();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Redis is an optimization. PostgreSQL remains authoritative.
  }
}

async function closeRedis() {
  if (client) { const current = client; client = undefined; current.disconnect(); }
}

module.exports = { cacheRead, cacheWrite, closeRedis };
