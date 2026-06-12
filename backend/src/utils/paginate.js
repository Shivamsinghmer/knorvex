/**
 * Paginate a Mongoose query and return standardized response shape.
 *
 * @param {mongoose.Query} query - A Mongoose query (not yet executed)
 * @param {mongoose.Model} model - The model to count documents on
 * @param {object} filter - The same filter used in query (for countDocuments)
 * @param {number|string} page - Page number (1-indexed), default 1
 * @param {number|string} limit - Items per page, default 20 (max 100)
 * @returns {Promise<{ data: any[], total: number, page: number, limit: number, hasMore: boolean }>}
 */
export const paginate = async (query, model, filter = {}, page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const [data, total] = await Promise.all([
    query.skip(skip).limit(l).lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page: p,
    limit: l,
    hasMore: p * l < total,
  };
};
