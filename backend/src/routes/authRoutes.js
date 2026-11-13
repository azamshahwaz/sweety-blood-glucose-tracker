
const express = require('express');
const rateLimit = require('express-rate-limit');

const env = require('../config/env');
const validate = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  registerSchema,
  loginSchema,
} = require('../validators/authValidator');

const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(ctrl.register)
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(ctrl.login)
);

// Logout revokes only the session belonging to the current tab.
router.post('/logout', requireAuth, asyncHandler(ctrl.logout));

router.get('/me', requireAuth, ctrl.me);

module.exports = router;
