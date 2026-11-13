const express = require('express');
const validate = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { monthQuerySchema, summaryQuerySchema } = require('../validators/reportValidator');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/reportController');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', validate(summaryQuerySchema, 'query'), asyncHandler(ctrl.summary));
router.get('/trends', validate(monthQuerySchema, 'query'), asyncHandler(ctrl.trends));

module.exports = router;
