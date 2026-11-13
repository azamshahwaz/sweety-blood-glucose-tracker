const { z } = require('zod');
const { isValidDateString, isValidMonthString } = require('../utils/dates');

const dateString = (label = 'date') =>
  z.string({ required_error: `Please select a ${label}.`, invalid_type_error: 'Invalid date.' })
    .refine(isValidDateString, 'Invalid date. Use the format YYYY-MM-DD.');

const monthString = z
  .string({ required_error: 'Month is required.' })
  .refine(isValidMonthString, 'Invalid month. Use the format YYYY-MM.');

const uuidParam = z.object({ id: z.string().uuid('Invalid reading id.') });

module.exports = { dateString, monthString, uuidParam };
