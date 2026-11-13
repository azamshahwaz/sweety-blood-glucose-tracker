const env = require('../config/env');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body.' });
  }
  if (err.isOperational) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }
  if (!env.isTest) console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
}

module.exports = { notFound, errorHandler };
