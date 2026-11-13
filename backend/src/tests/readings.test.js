const { setupDb, resetDb, closeDb, createUser, newAgent, pool } = require('./helpers');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(closeDb);

const base = { reading_date: '2025-06-10', time_slot: 'MORNING_FASTING', glucose_value: 110 };

describe('Readings API - create & validation', () => {
  test('creates a valid reading', async () => {
    const { agent, user } = await createUser();
    const res = await agent.post('/api/readings').send(base);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Reading added successfully');
    expect(res.body.data.reading).toMatchObject(base);
    expect(res.body.data.reading.interpretation).toMatchObject({ status: 'MODERATE', reading_type: 'Fasting', reference_range: '100–125 mg/dL' });
    expect(res.body.data.reading.user_id).toBeUndefined();
    const version = await pool.query('SELECT report_cache_version FROM users WHERE id=$1', [user.id]);
    expect(Number(version.rows[0].report_cache_version)).toBe(1);
  });

  test('rejects a missing glucose value', async () => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, glucose_value: undefined });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter a glucose value.');
  });

  test.each([[39], [0], [-5]])('rejects value %p below 40', async (v) => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, glucose_value: v });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be a whole number between 40 and 600 mg/dl.');
  });

  test('rejects value above 600', async () => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, glucose_value: 601 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be a whole number between 40 and 600 mg/dl.');
  });

  test.each([[120.5], ['120.5'], ['abc']])('rejects non-integer value %p', async (v) => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, glucose_value: v });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Value must be a whole number between 40 and 600 mg/dl.');
  });

  test('accepts boundary values 40 and 600', async () => {
    const { agent } = await createUser();
    await agent.post('/api/readings').send({ ...base, glucose_value: 40 }).expect(201);
    await agent.post('/api/readings').send({ ...base, time_slot: 'AFTER_LUNCH', glucose_value: 600 }).expect(201);
  });

  test('rejects a duplicate time slot on the same date', async () => {
    const { agent } = await createUser();
    await agent.post('/api/readings').send({ ...base, time_slot: 'AFTER_LUNCH' }).expect(201);
    const res = await agent.post('/api/readings').send({ ...base, time_slot: 'AFTER_LUNCH', glucose_value: 150 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('You already have an After lunch reading for this date.');
  });

  test('rejects the fifth reading on a day', async () => {
    const { agent } = await createUser();
    for (const slot of ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER']) {
      await agent.post('/api/readings').send({ ...base, time_slot: slot }).expect(201);
    }
    const res = await agent.post('/api/readings').send({ ...base, time_slot: 'AFTER_LUNCH' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('You can add only 4 readings per day.');
  });

  test('rejects a future date', async () => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, reading_date: '2999-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Date cannot be in the future.');
  });

  test.each(['2025-02-30', '10-06-2025', 'not-a-date'])('rejects invalid date %p', async (d) => {
    const { agent } = await createUser();
    const res = await agent.post('/api/readings').send({ ...base, reading_date: d });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid time slot', async () => {
    const { agent } = await createUser();
    await agent.post('/api/readings').send({ ...base, time_slot: 'MIDNIGHT' }).expect(400);
  });

  test('concurrent requests cannot create duplicate slot readings', async () => {
    const { agent, user } = await createUser();
    const results = await Promise.all(Array.from({ length: 6 }, () => agent.post('/api/readings').send(base)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(5);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM glucose_readings WHERE user_id = $1', [user.id]);
    expect(rows[0].c).toBe(1);
  });

  test('database constraints enforce range and slot values even when the API is bypassed', async () => {
    const { user } = await createUser();
    const ins = (slot, v) => pool.query('INSERT INTO glucose_readings (user_id, reading_date, time_slot, glucose_value) VALUES ($1,$2,$3,$4)', [user.id, '2025-06-10', slot, v]);
    await expect(ins('MORNING_FASTING', 39)).rejects.toThrow();
    await expect(ins('BEDTIME', 100)).rejects.toThrow();
  });
});

describe('Readings API - read, update, delete', () => {
  test('lists readings newest date first with pagination and filters', async () => {
    const { agent } = await createUser();
    await agent.post('/api/readings').send({ ...base, reading_date: '2025-06-09' });
    await agent.post('/api/readings').send({ ...base, reading_date: '2025-06-10' });
    await agent.post('/api/readings').send({ ...base, reading_date: '2025-05-20', time_slot: 'AFTER_DINNER' });

    const all = await agent.get('/api/readings').expect(200);
    expect(all.body.data.readings.map((r) => r.reading_date)).toEqual(['2025-06-10', '2025-06-09', '2025-05-20']);
    expect(all.body.data.pagination).toMatchObject({ total: 3, page: 1 });

    const june = await agent.get('/api/readings?month=2025-06').expect(200);
    expect(june.body.data.readings).toHaveLength(2);
    const day = await agent.get('/api/readings?date=2025-05-20').expect(200);
    expect(day.body.data.readings).toHaveLength(1);
    const slot = await agent.get('/api/readings?search=dinner').expect(200);
    expect(slot.body.data.readings[0].time_slot).toBe('AFTER_DINNER');
    const page = await agent.get('/api/readings?limit=2&page=2').expect(200);
    expect(page.body.data.readings).toHaveLength(1);
  });

  test('gets a single reading', async () => {
    const { agent } = await createUser();
    const { body } = await agent.post('/api/readings').send(base);
    const res = await agent.get(`/api/readings/${body.data.reading.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.reading.glucose_value).toBe(110);
    await agent.get('/api/readings/not-a-uuid').expect(400);
  });

  test('updates a reading and bumps updated_at', async () => {
    const { agent, user } = await createUser();
    const { body } = await agent.post('/api/readings').send(base);
    const id = body.data.reading.id;
    await new Promise((r) => setTimeout(r, 15));
    const res = await agent.put(`/api/readings/${id}`).send({ ...base, glucose_value: 135 });
    expect(res.status).toBe(200);
    expect(res.body.data.reading.glucose_value).toBe(135);
    expect(res.body.data.reading.interpretation.status).toBe('HIGH');
    expect(new Date(res.body.data.reading.updated_at).getTime()).toBeGreaterThan(new Date(body.data.reading.updated_at).getTime());
    const version = await pool.query('SELECT report_cache_version FROM users WHERE id=$1', [user.id]);
    expect(Number(version.rows[0].report_cache_version)).toBe(2);
  });

  test('update validates input and prevents duplicate slots', async () => {
    const { agent } = await createUser();
    await agent.post('/api/readings').send({ ...base, time_slot: 'AFTER_LUNCH' });
    const { body } = await agent.post('/api/readings').send(base);
    const id = body.data.reading.id;
    const dup = await agent.put(`/api/readings/${id}`).send({ ...base, time_slot: 'AFTER_LUNCH' });
    expect(dup.status).toBe(409);
    await agent.put(`/api/readings/${id}`).send({ ...base, glucose_value: 700 }).expect(400);
    // updating a reading without changing its slot must not conflict with itself
    await agent.put(`/api/readings/${id}`).send({ ...base, glucose_value: 120 }).expect(200);
  });

  test('deletes a reading', async () => {
    const { agent, user } = await createUser();
    const { body } = await agent.post('/api/readings').send(base);
    const id = body.data.reading.id;
    const res = await agent.delete(`/api/readings/${id}`);
    expect(res.status).toBe(200);
    await agent.get(`/api/readings/${id}`).expect(404);
    await agent.delete(`/api/readings/${id}`).expect(404);
    const version = await pool.query('SELECT report_cache_version FROM users WHERE id=$1', [user.id]);
    expect(Number(version.rows[0].report_cache_version)).toBe(2);
  });
});

describe('Readings API - ownership isolation', () => {
  let alice;
  let bob;
  let readingId;

  beforeEach(async () => {
    alice = await createUser();
    bob = await createUser();
    const { body } = await alice.agent.post('/api/readings').send(base);
    readingId = body.data.reading.id;
  });

  test("a user cannot read another user's reading", async () => {
    await bob.agent.get(`/api/readings/${readingId}`).expect(404);
    const list = await bob.agent.get('/api/readings').expect(200);
    expect(list.body.data.readings).toHaveLength(0);
  });

  test("a user cannot update another user's reading", async () => {
    await bob.agent.put(`/api/readings/${readingId}`).send({ ...base, glucose_value: 500 }).expect(404);
    const mine = await alice.agent.get(`/api/readings/${readingId}`);
    expect(mine.body.data.reading.glucose_value).toBe(110);
  });

  test("a user cannot delete another user's reading", async () => {
    await bob.agent.delete(`/api/readings/${readingId}`).expect(404);
    await alice.agent.get(`/api/readings/${readingId}`).expect(200);
  });

  test('user_id supplied by the client is ignored', async () => {
    const res = await bob.agent.post('/api/readings').send({ ...base, user_id: alice.user.id });
    expect(res.status).toBe(201);
    const aliceList = await alice.agent.get('/api/readings');
    expect(aliceList.body.data.readings).toHaveLength(1);
  });
});
