
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

const register = async (req, res) => {
  const user = await authService.register(req.validated.body);

  sendSuccess(res, { user }, 'Account created successfully', 201);
};

const login = async (req, res) => {
  const { user, token, maxAgeMs } = await authService.login(
    req.validated.body
  );

  sendSuccess(
    res,
    {
      user,
      tabSessionToken: token,
      maxAgeMs,
    },
    'Logged in successfully'
  );
};

const logout = async (req, res) => {
  await authService.logout(req.authSessionId, req.user.id);

  sendSuccess(res, {}, 'Logged out successfully');
};

const me = (req, res) => {
  sendSuccess(res, { user: req.user }, 'OK');
};

module.exports = {
  register,
  login,
  logout,
  me,
};
