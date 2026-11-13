
const env = require('../config/env');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get('origin');

  if (
    origin &&
    !env.frontendUrls.includes(origin.replace(/\/$/, ''))
  ) {
    return next(
      new AppError(403, 'Request origin is not allowed.')
    );
  }

  return next();
}

module.exports = csrfProtection;
