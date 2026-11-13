
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(__dirname)
      .filter((file) => /^\d+.*\.sql$/.test(file))
      .sort();

    const applied = [];

    for (const file of files) {
      const result = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [file]
      );

      if (result.rowCount > 0) {
        continue;
      }

      await client.query('BEGIN');

      try {
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');

        await client.query(sql);

        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );

        await client.query('COMMIT');
        applied.push(file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${error.message}`);
      }
    }

    return applied;
  } finally {
    client.release();
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then((applied) => {
      console.log(
        applied.length
          ? `Applied migrations: ${applied.join(', ')}`
          : 'Database is up to date.'
      );
    })
    .catch((error) => {
      console.error('Migration failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
