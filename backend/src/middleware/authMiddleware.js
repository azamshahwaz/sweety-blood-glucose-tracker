
const jwt = require('jsonwebtoken');

const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');

async function requireAuth(req, _res, next) {
  try {
    const token = req.get('X-Tab-Session');

    if (!token || typeof token !== 'string') {
      throw new AppError(401, 'Authentication required. Please log in.');
    }

    let payload;

    try {
      payload = jwt.verify(token, env.jwtSecret, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new AppError(
        401,
        'Your session is invalid or has expired. Please log in again.'
      );
    }

    if (!payload.sub || !payload.sid) {
      throw new AppError(401, 'Invalid authentication session.');
    }

    const { rows } = await db.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.created_at,
         s.id AS session_id
       FROM tab_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
         AND s.user_id = $2
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
       LIMIT 1`,
      [payload.sid, payload.sub]
    );

    if (!rows[0]) {
      throw new AppError(
        401,
        'Your session is invalid or has expired. Please log in again.'
      );
    }

    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role || 'PATIENT',
      created_at: rows[0].created_at,
    };

    req.authSessionId = rows[0].session_id;

    // Update activity timestamp without blocking authentication.
    db.query(
      'UPDATE tab_sessions SET last_seen_at = NOW() WHERE id = $1',
      [req.authSessionId]
    ).catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          'You do not have permission to access this resource.'
        )
      );
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
