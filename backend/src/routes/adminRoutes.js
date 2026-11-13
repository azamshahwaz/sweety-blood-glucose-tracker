const express = require('express');
const { z } = require('zod');
const validate = require('../middleware/validateRequest');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN'));
router.get('/accounts', asyncHandler(ctrl.list));
router.post('/doctors', validate(z.object({ name: z.string().min(2).max(100), email: z.string().email().max(255), password: z.string().min(8).max(128).refine((value) => Buffer.byteLength(value) <= 72, 'Password must be at most 72 bytes.') })), asyncHandler(ctrl.createDoctor));
router.post('/assignments', validate(z.object({ doctorId: z.string().uuid(), patientId: z.string().uuid() })), asyncHandler(ctrl.assign));
router.delete('/assignments/:assignmentId', validate(z.object({ assignmentId: z.string().uuid() }), 'params'), asyncHandler(ctrl.unassign));
module.exports = router;
