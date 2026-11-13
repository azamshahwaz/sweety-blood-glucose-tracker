const express = require('express');
const validate = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { readingSchema, listQuerySchema } = require('../validators/readingValidator');
const { z } = require('zod');
const { TIME_SLOTS } = require('../utils/constants');
const { uuidParam } = require('../validators/common');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/readingController');

const router = express.Router();
router.use(requireAuth);

router.post('/interpretation', validate(z.object({
  glucose_value: z.coerce.number().int().min(40).max(600),
  time_slot: z.enum(TIME_SLOTS),
  fasting_confirmed: z.boolean().optional().nullable(),
  meal_timing_minutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
})), asyncHandler(ctrl.interpret));
router.post('/', validate(readingSchema), asyncHandler(ctrl.create));
router.get('/', validate(listQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/:id', validate(uuidParam, 'params'), asyncHandler(ctrl.getOne));
router.put('/:id', validate(uuidParam, 'params'), validate(readingSchema), asyncHandler(ctrl.update));
router.delete('/:id', validate(uuidParam, 'params'), asyncHandler(ctrl.remove));

module.exports = router;
