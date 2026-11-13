const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool } = require('../src/config/db');

async function createAdmin() {
  const email = env.bootstrapAdminEmail.trim().toLowerCase();
  const password = env.bootstrapAdminPassword;
  if (!/^\S+@\S+\.\S+$/.test(email) || !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}/.test(password) || Buffer.byteLength(password) > 72) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a unique 12+ character BOOTSTRAP_ADMIN_PASSWORD in backend/.env before running this command.');
  }
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const { rows } = await pool.query(
    `INSERT INTO users(name,email,password_hash,role) VALUES('Sweety Administrator',$1,$2,'ADMIN')
     ON CONFLICT(email) DO UPDATE SET role='ADMIN' RETURNING id,email,role`, [email, hash]
  );
  console.log(`Administrator role is ready for ${rows[0].email}.`);
}

createAdmin().catch((err) => { console.error('Admin setup failed:', err.message); process.exitCode = 1; }).finally(() => pool.end());
