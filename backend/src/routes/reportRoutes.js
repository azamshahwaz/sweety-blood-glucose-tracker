const express = require('express');
const validate = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { dateQuerySchema } = require('../validators/reportValidator');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/reportController');

const router = express.Router();
router.use(requireAuth);

router.get('/daily', validate(dateQuerySchema, 'query'), asyncHandler(ctrl.daily));
router.get('/month-to-date', validate(dateQuerySchema, 'query'), asyncHandler(ctrl.monthToDate));
router.get('/monthly', validate(dateQuerySchema, 'query'), asyncHandler(ctrl.monthly));

module.exports = router;
