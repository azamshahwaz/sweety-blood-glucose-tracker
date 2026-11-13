jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../services/redisClient', () => ({ cacheRead: jest.fn(), cacheWrite: jest.fn() }));

const db = require('../config/db');
const { cacheRead, cacheWrite } = require('../services/redisClient');
const { cachedReport } = require('../services/reportCache');

describe('report cache namespace and cache-aside behavior', () => {
  beforeEach(() => { jest.clearAllMocks(); db.query.mockResolvedValue({ rows: [{ report_cache_version: '3' }] }); cacheRead.mockResolvedValue(null); });
  test('loads from PostgreSQL once on a miss, stores with finite TTL, then returns cached result', async () => {
    const result = { stats: { total: 1 } };
    const loader = jest.fn(async () => { await db.query('SELECT report aggregates'); return result; });
    expect(await cachedReport('user-a', 'daily', '2026-11-13', loader)).toEqual(result);
    expect(cacheWrite).toHaveBeenCalledWith('report:user:user-a:v3:daily:2026-11-13', result, 300);
    expect(db.query).toHaveBeenCalledTimes(2); // generation and report aggregation
    cacheRead.mockResolvedValue(result);
    expect(await cachedReport('user-a', 'daily', '2026-11-13', loader)).toEqual(result);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledTimes(3); // a cache hit reads only the generation
  });
  test('namespaces cache by user, type and period', async () => {
    await cachedReport('user-a', 'daily', '2026-11-13', async () => ({}));
    await cachedReport('user-b', 'daily', '2026-11-13', async () => ({}));
    await cachedReport('user-a', 'mtd', '2026-11-13', async () => ({}));
    await cachedReport('user-a', 'daily', '2026-11-14', async () => ({}));
    expect(cacheRead.mock.calls.map(([key]) => key)).toEqual([
      'report:user:user-a:v3:daily:2026-11-13', 'report:user:user-b:v3:daily:2026-11-13',
      'report:user:user-a:v3:mtd:2026-11-13', 'report:user:user-a:v3:daily:2026-11-14',
    ]);
  });
  test('uses the current database generation so mutation-version changes bypass old cached data', async () => {
    const loader = jest.fn().mockResolvedValue({ fresh: true });
    cacheRead.mockResolvedValue({ stale: true });
    await cachedReport('user-a', 'daily', '2026-11-13', loader);
    db.query.mockResolvedValueOnce({ rows: [{ report_cache_version: '4' }] });
    cacheRead.mockResolvedValueOnce(null);
    expect(await cachedReport('user-a', 'daily', '2026-11-13', loader)).toEqual({ fresh: true });
    expect(cacheRead.mock.calls.at(-1)[0]).toBe('report:user:user-a:v4:daily:2026-11-13');
  });
  test('falls through to PostgreSQL when Redis read or write is unavailable', async () => {
    cacheRead.mockResolvedValue(null); cacheWrite.mockRejectedValue(new Error('unavailable'));
    await expect(cachedReport('user-a', 'daily', '2026-11-13', async () => ({ ok: true }))).resolves.toEqual({ ok: true });
  });
});
