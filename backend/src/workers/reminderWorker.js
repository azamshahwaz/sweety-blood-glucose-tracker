const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');
const db = require('../config/db');
const { todayInTimezone } = require('../utils/dates');
const { createMissingReadingReminders } = require('../services/reminderService');

const QUEUE_NAME = 'daily-reading-reminders';
const SCHEDULER_ID = 'daily-reading-reminders-8pm-ist';
const connectionOptions = {
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
};

async function scheduleDailyReminders(queue) {
  return queue.upsertJobScheduler(SCHEDULER_ID, {
    pattern: '0 20 * * *',
    tz: 'Asia/Kolkata',
  }, {
    name: 'create-daily-reminder-logs',
    data: {},
    opts: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 }, removeOnComplete: 100, removeOnFail: 500 },
  });
}

async function startWorker() {
  const connection = new IORedis(connectionOptions);
  connection.on('error', (err) => console.error('Reminder Redis connection error:', err.message));
  const queue = new Queue(QUEUE_NAME, { connection });
  const worker = new Worker(QUEUE_NAME, async () => {
    const date = todayInTimezone('Asia/Kolkata');
    const created = await createMissingReadingReminders(date);
    console.log(`Reminder job completed for ${date}: ${created} log(s) created.`);
    return { date, created };
  }, {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 60_000 },
  });
  worker.on('failed', (job, err) => console.error(`Reminder job ${job?.id || 'unknown'} failed:`, err.message));
  worker.on('error', (err) => console.error('Reminder worker error:', err.message));

  try {
    // BullMQ upsert makes repeated process starts safe; the scheduler id is stable.
    await scheduleDailyReminders(queue);
    console.log('Daily reminder scheduler ready for 8:00 PM Asia/Kolkata.');
  } catch (err) {
    await worker.close().catch(() => {});
    await queue.close().catch(() => {});
    await connection.quit().catch(() => {});
    throw err;
  }

  let closing;
  const shutdown = () => {
    if (closing) return closing;
    closing = (async () => {
      await worker.close();
      await queue.close();
      await connection.quit();
      await db.pool.end();
    })()
      .then(() => process.exit(0))
      .catch((err) => { console.error('Reminder worker shutdown error:', err.message); process.exit(1); });
    return closing;
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return { queue, worker, connection, shutdown };
}

if (require.main === module) {
  startWorker().catch(async (err) => {
    console.error('Unable to start reminder worker:', err.message);
    await db.pool.end().catch(() => {});
    process.exit(1);
  });
}

module.exports = { startWorker, scheduleDailyReminders, QUEUE_NAME, SCHEDULER_ID };
