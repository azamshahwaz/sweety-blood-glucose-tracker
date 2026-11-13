const AppError = require('../utils/AppError');

// validate(schema, 'body' | 'query' | 'params') -> stores parsed data on req.validated[source]
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] || {});
  if (!result.success) {
    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || source;
      if (!errors[key]) errors[key] = issue.message;
    }
    return next(new AppError(400, Object.values(errors)[0], errors));
  }
  req.validated = { ...(req.validated || {}), [source]: result.data };
  return next();
};

module.exports = validate;
