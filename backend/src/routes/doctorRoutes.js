const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validateRequest');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { uuidParam } = require('../validators/common');
const { dateQuerySchema } = require('../validators/reportValidator');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/doctorController');

const router = express.Router();
router.use(requireAuth, requireRole('DOCTOR'));
router.get('/patients', validate(z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(100).optional().default('') }), 'query'), asyncHandler(ctrl.patients));
router.get('/patients/:patientId/readings', validate(z.object({ patientId: z.string().uuid() }), 'params'), validate(z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }), 'query'), asyncHandler(ctrl.readings));
for (const [path, handler] of [['daily', ctrl.daily], ['month-to-date', ctrl.mtd], ['monthly', ctrl.monthly]]) {
  router.get(`/patients/:patientId/reports/${path}`, validate(z.object({ patientId: z.string().uuid() }), 'params'), validate(dateQuerySchema, 'query'), asyncHandler(handler));
}
module.exports = router;
