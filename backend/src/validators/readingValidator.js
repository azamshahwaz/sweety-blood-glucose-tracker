const { z } = require('zod');
const env = require('../config/env');
const { TIME_SLOTS, GLUCOSE_MIN, GLUCOSE_MAX } = require('../utils/constants');
const { todayInTimezone } = require('../utils/dates');
const { dateString, monthString } = require('./common');

const REQUIRED_MSG = 'Please enter a glucose value.';
const RANGE_MSG = `Value must be a whole number between ${GLUCOSE_MIN} and ${GLUCOSE_MAX} mg/dl.`;

// Accepts whole numbers (or numeric strings). Rejects decimals, NaN, out-of-range values.
const glucoseValue = z
  .unknown()
  .superRefine((v, ctx) => {
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_MSG });
      return;
    }
    let n = NaN;
    if (typeof v === 'number') n = v;
    else if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) n = Number(v);
    if (!Number.isInteger(n) || n < GLUCOSE_MIN || n > GLUCOSE_MAX) {
      ctx.addIssue({ code: 'custom', message: RANGE_MSG });
    }
  })
  .transform((v) => Number(v));

const readingSchema = z.object({
  reading_date: dateString('date').refine((d) => d <= todayInTimezone(env.timeZone), 'Date cannot be in the future.'),
  time_slot: z.enum(TIME_SLOTS, { errorMap: () => ({ message: 'Please select a valid time slot.' }) }),
  glucose_value: glucoseValue,
  fasting_confirmed: z.boolean().optional().nullable(),
  meal_timing_minutes: z.union([z.number().int(), z.string().regex(/^\d+$/).transform(Number)]).optional().nullable(),
}).superRefine((reading, ctx) => {
  if (reading.fasting_confirmed !== undefined && reading.fasting_confirmed !== null && typeof reading.fasting_confirmed !== 'boolean') {
    ctx.addIssue({ code: 'custom', path: ['fasting_confirmed'], message: 'Fasting confirmation must be true or false.' });
  }
  if (reading.meal_timing_minutes !== undefined && reading.meal_timing_minutes !== null && (reading.meal_timing_minutes < 0 || reading.meal_timing_minutes > 1440)) {
    ctx.addIssue({ code: 'custom', path: ['meal_timing_minutes'], message: 'Meal timing must be between 0 and 1440 minutes.' });
  }
  if (reading.time_slot === 'MORNING_FASTING' && reading.meal_timing_minutes != null) {
    ctx.addIssue({ code: 'custom', path: ['meal_timing_minutes'], message: 'Meal timing is only used for post-meal readings.' });
  }
  if (reading.time_slot !== 'MORNING_FASTING' && reading.fasting_confirmed != null) {
    ctx.addIssue({ code: 'custom', path: ['fasting_confirmed'], message: 'Fasting confirmation is only used for morning fasting readings.' });
  }
});

const listQuerySchema = z.object({
  month: monthString.optional(),
  date: dateString('date').optional(),
  search: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = { readingSchema, listQuerySchema };
