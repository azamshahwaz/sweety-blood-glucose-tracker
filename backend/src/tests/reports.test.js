const { setupDb, resetDb, closeDb, createUser, insertReadings, newAgent } = require('./helpers');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(closeDb);

const [M, B, L, D] = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

describe('Reports API', () => {
  test('daily report: highest, lowest, average, total and ordered readings', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [['2025-03-10', L, 200], ['2025-03-10', M, 100], ['2025-03-10', B, 150], ['2025-03-11', M, 300]]);
    const res = await agent.get('/api/reports/daily?date=2025-03-10');
    expect(res.status).toBe(200);
    expect(res.body.data.stats).toEqual({ total: 3, highest: 200, lowest: 100, average: 150 });
    expect(res.body.data.readings.map((r) => r.time_slot)).toEqual([M, B, L]);
    expect(res.body.data.range).toEqual({ from: '2025-03-10', to: '2025-03-10' });
  });

  test('month-to-date report uses inclusive range from 1st to selected date', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [
      ['2025-02-28', M, 500], // before range
      ['2025-03-01', M, 100], // first day (inclusive)
      ['2025-03-15', M, 200], // selected day (inclusive)
      ['2025-03-16', M, 600], // after range
    ]);
    const res = await agent.get('/api/reports/month-to-date?date=2025-03-15');
    expect(res.body.data.range).toEqual({ from: '2025-03-01', to: '2025-03-15' });
    expect(res.body.data.stats).toEqual({ total: 2, highest: 200, lowest: 100, average: 150 });
    expect(res.body.data.dailyAverages).toHaveLength(2);
  });

  test('previous month report covers the whole previous calendar month', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [
      ['2025-01-31', M, 600], ['2025-02-01', M, 80], ['2025-02-28', M, 120], ['2025-03-01', M, 500], ['2025-03-15', M, 500],
    ]);
    const res = await agent.get('/api/reports/monthly?date=2025-03-15');
    expect(res.body.data.range).toEqual({ from: '2025-02-01', to: '2025-02-28' });
    expect(res.body.data.stats).toEqual({ total: 2, highest: 120, lowest: 80, average: 100 });
  });

  test('averages are rounded to one decimal place', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [['2025-03-10', M, 100], ['2025-03-10', B, 101], ['2025-03-10', L, 101]]);
    const res = await agent.get('/api/reports/daily?date=2025-03-10');
    expect(res.body.data.stats.average).toBe(100.7);
  });

  test('empty ranges return a friendly empty state with no division errors', async () => {
    const { agent } = await createUser();
    for (const path of ['daily', 'month-to-date', 'monthly']) {
      const res = await agent.get(`/api/reports/${path}?date=2025-03-10`);
      expect(res.status).toBe(200);
      expect(res.body.data.isEmpty).toBe(true);
      expect(res.body.data.stats).toEqual({ total: 0, highest: null, lowest: null, average: null });
    }
  });

  test('handles year boundary (Jan -> previous December) and leap years', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [['2024-12-31', M, 140], ['2024-02-29', M, 90]]);
    const jan = await agent.get('/api/reports/monthly?date=2025-01-15');
    expect(jan.body.data.range).toEqual({ from: '2024-12-01', to: '2024-12-31' });
    expect(jan.body.data.stats.total).toBe(1);
    const mar = await agent.get('/api/reports/monthly?date=2024-03-10');
    expect(mar.body.data.range).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(mar.body.data.stats.highest).toBe(90);
  });

  test("never includes another user's data", async () => {
    const a = await createUser();
    const b = await createUser();
    await insertReadings(a.user.id, [['2025-03-10', M, 100]]);
    await insertReadings(b.user.id, [['2025-03-10', M, 400], ['2025-03-10', B, 500]]);
    for (const path of ['daily', 'month-to-date']) {
      const res = await a.agent.get(`/api/reports/${path}?date=2025-03-10`);
      expect(res.body.data.stats).toEqual({ total: 1, highest: 100, lowest: 100, average: 100 });
    }
  });

  test('validates the date query parameter', async () => {
    const { agent } = await createUser();
    await agent.get('/api/reports/daily').expect(400);
    await agent.get('/api/reports/daily?date=2025-13-01').expect(400);
    await newAgent().get('/api/reports/daily?date=2025-03-10').expect(401);
  });
});

describe('Dashboard API', () => {
  test('summary returns counts, month stats and the five most recent readings', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [
      ['2025-03-10', M, 100], ['2025-03-10', B, 140], ['2025-03-09', M, 90],
      ['2025-03-08', M, 95], ['2025-03-07', M, 105], ['2025-03-06', M, 110], ['2025-02-10', M, 300],
    ]);
    const res = await agent.get('/api/dashboard/summary?date=2025-03-10');
    expect(res.status).toBe(200);
    expect(res.body.data.today).toEqual({ count: 2, max: 4 });
    expect(res.body.data.stats).toMatchObject({ total: 7 - 1, highest: 140, lowest: 90 });
    expect(res.body.data.recent).toHaveLength(5);
    expect(res.body.data.recent[0]).toMatchObject({ reading_date: '2025-03-10', time_slot: B });
  });

  test('summary is empty-safe for new users', async () => {
    const { agent } = await createUser();
    const res = await agent.get('/api/dashboard/summary?date=2025-03-10');
    expect(res.body.data.stats.total).toBe(0);
    expect(res.body.data.recent).toEqual([]);
  });

  test('trends returns daily averages, per-day counts and all four slot counts', async () => {
    const { agent, user } = await createUser();
    await insertReadings(user.id, [['2025-03-10', M, 100], ['2025-03-10', B, 200], ['2025-03-11', M, 120]]);
    const res = await agent.get('/api/dashboard/trends?month=2025-03');
    expect(res.status).toBe(200);
    expect(res.body.data.dailyTrend[0]).toMatchObject({ date: '2025-03-10', average: 150, count: 2 });
    expect(res.body.data.slotCounts).toEqual([
      { time_slot: M, count: 2 }, { time_slot: B, count: 1 }, { time_slot: L, count: 0 }, { time_slot: D, count: 0 },
    ]);
    expect(res.body.data.totalReadings).toBe(3);
    await agent.get('/api/dashboard/trends?month=2025-3').expect(400);
  });
});
