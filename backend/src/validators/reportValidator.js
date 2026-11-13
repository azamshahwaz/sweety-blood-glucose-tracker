const { z } = require('zod');
const { dateString, monthString } = require('./common');

const dateQuerySchema = z.object({ date: dateString('date') });
const monthQuerySchema = z.object({ month: monthString });
const summaryQuerySchema = z.object({ date: dateString('date'), month: monthString.optional() });

module.exports = { dateQuerySchema, monthQuerySchema, summaryQuerySchema };
