const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');
const { COOKIE_NAME, baseOptions } = require('../utils/cookie');

const register = async (req, res) => {
  const user = await authService.register(req.validated.body);
  sendSuccess(res, { user }, 'Account created successfully', 201);
};

const login = async (req, res) => {
  const { user, token, maxAgeMs } = await authService.login(req.validated.body);
  res.cookie(COOKIE_NAME, token, { ...baseOptions(), maxAge: maxAgeMs });
  sendSuccess(res, { user }, 'Logged in successfully');
};

const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, baseOptions());
  sendSuccess(res, {}, 'Logged out successfully');
};

const me = (req, res) => sendSuccess(res, { user: req.user }, 'OK');

module.exports = { register, login, logout, me };
