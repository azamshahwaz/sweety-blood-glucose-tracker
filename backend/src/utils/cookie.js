const env = require('../config/env');

const COOKIE_NAME = 'sweety_token';

// Same-site (localhost dev) => Lax. Cross-site HTTPS deployment (COOKIE_SECURE=true) => None+Secure.
const baseOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? 'none' : 'lax',
  path: '/',
});

module.exports = { COOKIE_NAME, baseOptions };
