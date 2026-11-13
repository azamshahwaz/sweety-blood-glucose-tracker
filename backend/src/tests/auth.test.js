const bcrypt = require('bcryptjs');
const { app, request, pool, setupDb, resetDb, closeDb, newAgent, createUser, ORIGIN } = require('./helpers');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(closeDb);

const validBody = { name: 'Asha Rao', email: 'asha@example.com', password: 'StrongPass1!', confirmPassword: 'StrongPass1!' };

describe('Auth API', () => {
  test('registers a new user and never returns the password hash', async () => {
    const res = await newAgent().post('/api/auth/register').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com' });
    expect(res.body.data.user.password_hash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('StrongPass1!');
  });

  test('rejects duplicate email registration', async () => {
    await newAgent().post('/api/auth/register').send(validBody).expect(201);
    const res = await newAgent().post('/api/auth/register').send({ ...validBody, email: 'ASHA@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('stores the password as a bcrypt hash', async () => {
    await newAgent().post('/api/auth/register').send(validBody).expect(201);
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['asha@example.com']);
    expect(rows[0].password_hash).not.toBe('StrongPass1!');
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('StrongPass1!', rows[0].password_hash)).toBe(true);
  });

  test.each([
    [{ ...validBody, password: 'short', confirmPassword: 'short' }, /at least 8/],
    [{ ...validBody, confirmPassword: 'Different1' }, /do not match/],
    [{ ...validBody, email: 'not-an-email' }, /valid email/],
    [{ ...validBody, name: '  ' }, /name is required/i],
  ])('validates registration input %#', async (body, message) => {
    const res = await newAgent().post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Object.values(res.body.errors).join(' ')).toMatch(message);
  });

  test('logs in with correct credentials and sets an HTTP-only cookie', async () => {
    await newAgent().post('/api/auth/register').send(validBody).expect(201);
    const res = await newAgent().post('/api/auth/login').send({ email: 'asha@example.com', password: 'StrongPass1!' });
    expect(res.status).toBe(200);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/sweety_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(res.body.data.token).toBeUndefined();
  });

  test('rejects an incorrect password and an unknown email with the same message', async () => {
    await newAgent().post('/api/auth/register').send(validBody).expect(201);
    const wrong = await newAgent().post('/api/auth/login').send({ email: 'asha@example.com', password: 'WrongPass1' });
    const unknown = await newAgent().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'WrongPass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  test('rejects requests without an authentication token', async () => {
    for (const path of ['/api/auth/me', '/api/readings', '/api/reports/daily?date=2025-01-01', '/api/dashboard/summary?date=2025-01-01']) {
      const res = await newAgent().get(path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  test('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'sweety_token=not.a.jwt');
    expect(res.status).toBe(401);
  });

  test('allows access to protected routes when logged in', async () => {
    const { agent, user } = await createUser();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  test('logout clears the cookie and blocks further access', async () => {
    const { agent } = await createUser();
    await agent.get('/api/auth/me').expect(200);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'][0]).toMatch(/sweety_token=;/);
    await agent.get('/api/auth/me').expect(401);
  });

  test('CSRF protection: state-changing requests from a foreign origin are rejected', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'http://evil.example').send({ email: 'a@b.co', password: 'x' });
    expect(res.status).toBe(403);
    const ok = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send({ email: 'a@b.co', password: 'x' });
    expect(ok.status).toBe(401);
  });

  test('unknown routes and malformed JSON return JSON errors', async () => {
    const nf = await request(app).get('/api/nope');
    expect(nf.status).toBe(404);
    expect(nf.body.success).toBe(false);
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
  });
});
