const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');
const { closeRedis } = require('./services/redisClient');

const server = app.listen(env.port, () => console.log(`Sweety API listening on port ${env.port} (${env.nodeEnv})`));

const shutdown = () => server.close(() => Promise.all([pool.end(), closeRedis()]).then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
