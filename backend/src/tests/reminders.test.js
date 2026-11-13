const { setupDb, resetDb, closeDb, pool, createUser, insertReadings } = require('./helpers');
const { createMissingReadingReminders } = require('../services/reminderService');
const { scheduleDailyReminders, SCHEDULER_ID } = require('../workers/reminderWorker');
const { todayInTimezone } = require('../utils/dates');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(closeDb);

const date = '2026-06-15';
const slots = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

describe('daily reminder logs', () => {
  test.each([0, 1, 2, 3])('creates one log for a user with %i readings', async (count) => {
    const { user } = await createUser();
    await insertReadings(user.id, slots.slice(0, count).map((slot) => [date, slot, 110]));
    expect(await createMissingReadingReminders(date)).toBe(1);
    const { rows } = await pool.query('SELECT user_id, reminder_date::text FROM reminder_logs');
    expect(rows).toEqual([{ user_id: user.id, reminder_date: date }]);
  });

  test('does not create a log for a user with 4 readings', async () => {
    const { user } = await createUser();
    await insertReadings(user.id, slots.map((slot) => [date, slot, 110]));
    expect(await createMissingReadingReminders(date)).toBe(0);
    const { rows } = await pool.query('SELECT id FROM reminder_logs');
    expect(rows).toHaveLength(0);
  });

  test('processes multiple users independently and only logs users below 4', async () => {
    const users = await Promise.all(Array.from({ length: 3 }, () => createUser()));
    await insertReadings(users[0].user.id, slots.slice(0, 2).map((slot) => [date, slot, 100]));
    await insertReadings(users[1].user.id, slots.map((slot) => [date, slot, 100]));
    expect(await createMissingReadingReminders(date)).toBe(2);
    const { rows } = await pool.query('SELECT user_id FROM reminder_logs ORDER BY user_id');
    expect(rows.map((r) => r.user_id).sort()).toEqual([users[0].user.id, users[2].user.id].sort());
  });

  test('duplicate executions create only one log per user per day', async () => {
    const { user } = await createUser();
    expect(await createMissingReadingReminders(date)).toBe(1);
    expect(await createMissingReadingReminders(date)).toBe(0);
    const { rows } = await pool.query('SELECT id FROM reminder_logs WHERE user_id = $1 AND reminder_date = $2', [user.id, date]);
    expect(rows).toHaveLength(1);
  });
});

describe('reminder scheduling resilience', () => {
  test('uses a stable scheduler id and 8 PM IST schedule for repeated registration', async () => {
    const queue = { upsertJobScheduler: jest.fn().mockResolvedValue({}) };
    await scheduleDailyReminders(queue);
    await scheduleDailyReminders(queue);
    expect(queue.upsertJobScheduler).toHaveBeenCalledTimes(2);
    expect(queue.upsertJobScheduler.mock.calls[0]).toEqual([
      SCHEDULER_ID,
      { pattern: '0 20 * * *', tz: 'Asia/Kolkata' },
      expect.objectContaining({ opts: expect.objectContaining({ attempts: 5 }) }),
    ]);
  });

  test('surfaces Redis scheduling failures so the worker exits and can be restarted', async () => {
    const queue = { upsertJobScheduler: jest.fn().mockRejectedValue(new Error('Redis unavailable')) };
    await expect(scheduleDailyReminders(queue)).rejects.toThrow('Redis unavailable');
  });

  test('resolves the current IST date across UTC midnight boundaries', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-14T18:29:59.000Z'));
    expect(todayInTimezone('Asia/Kolkata')).toBe('2026-06-14');
    jest.setSystemTime(new Date('2026-06-14T18:30:00.000Z'));
    expect(todayInTimezone('Asia/Kolkata')).toBe('2026-06-15');
    jest.useRealTimers();
  });
});
