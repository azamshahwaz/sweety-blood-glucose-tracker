
const express = require('express');
const { z } = require('zod');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateRequest');
const asyncHandler = require('../utils/asyncHandler');
const { uuidParam } = require('../validators/common');
const controller = require('../controllers/notificationController');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('PATIENT'));

router.get('/', asyncHandler(controller.list));

router.patch(
  '/read-all',
  asyncHandler(controller.markAllRead)
);

router.patch(
  '/:id/read',
  validate(uuidParam, 'params'),
  asyncHandler(controller.markRead)
);

module.exports = router;
