const express = require('express');
const validate = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/authMiddleware');
const { readingSchema, listQuerySchema } = require('../validators/readingValidator');
const { uuidParam } = require('../validators/common');
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/readingController');

const router = express.Router();
router.use(requireAuth);

router.post('/', validate(readingSchema), asyncHandler(ctrl.create));
router.get('/', validate(listQuerySchema, 'query'), asyncHandler(ctrl.list));
router.get('/:id', validate(uuidParam, 'params'), asyncHandler(ctrl.getOne));
router.put('/:id', validate(uuidParam, 'params'), validate(readingSchema), asyncHandler(ctrl.update));
router.delete('/:id', validate(uuidParam, 'params'), asyncHandler(ctrl.remove));

module.exports = router;
