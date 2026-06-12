import ApiError from '../utils/ApiError.js';

/**
 * Zod schema validation middleware factory.
 *
 * Usage:
 *   router.post('/route', validate(myZodSchema), controller)
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate req.body against
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return next(ApiError.badRequest(messages));
  }
  req.body = result.data; // Replace with parsed + coerced data
  next();
};

export default validate;
