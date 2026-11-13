const env = require('../config/env');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Origin-based CSRF protection for cookie auth: browsers always send an Origin header on
// cross-site state-changing requests, so a non-allowed Origin is rejected. Requests with no
// Origin (curl, server-to-server) cannot be forged by a victim's browser and are allowed.
function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !env.frontendUrls.includes(origin.replace(/\/$/, ''))) {
    return next(new AppError(403, 'Request origin is not allowed.'));
  }
  return next();
}

module.exports = csrfProtection;
