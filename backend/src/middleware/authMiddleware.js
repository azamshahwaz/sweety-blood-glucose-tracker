const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { COOKIE_NAME } = require('../utils/cookie');

// Identity always comes from the verified JWT, never from client-supplied ids.
async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) throw new AppError(401, 'Authentication required. Please log in.');
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError(401, 'Your session is invalid or has expired. Please log in again.');
    }
    const { rows } = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) throw new AppError(401, 'Your session is invalid or has expired. Please log in again.');
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to access this resource.'));
    next();
  };
}

module.exports = { requireAuth, requireRole };
