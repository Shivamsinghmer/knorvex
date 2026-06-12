import User from '../models/User.js';
import CoinLedger from '../models/CoinLedger.js';
import ApiError from '../utils/ApiError.js';

/**
 * Credit coins to a user and write ledger entry
 * @param {string} userId - MongoDB user ID
 * @param {number} delta - Positive amount to credit
 * @param {string} reason - Human-readable reason
 * @param {string|null} sessionId - Optional session reference
 * @returns {Promise<number>} New balance
 */
export const creditCoins = async (userId, delta, reason, sessionId = null) => {
  if (delta <= 0) throw new Error('creditCoins: delta must be positive');

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  user.skillCoinBalance += delta;
  await user.save();

  await CoinLedger.create({
    userId,
    delta,
    reason,
    sessionId,
    balanceAfter: user.skillCoinBalance,
  });

  return user.skillCoinBalance;
};

/**
 * Debit coins from a user and write ledger entry
 * Throws if balance insufficient (< 50 minimum)
 * @param {string} userId - MongoDB user ID
 * @param {number} delta - Positive amount to debit (stored as negative in ledger)
 * @param {string} reason - Human-readable reason
 * @param {string|null} sessionId - Optional session reference
 * @returns {Promise<number>} New balance
 */
export const debitCoins = async (userId, delta, reason, sessionId = null) => {
  if (delta <= 0) throw new Error('debitCoins: delta must be positive');

  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (user.skillCoinBalance < delta) {
    throw ApiError.badRequest(`Insufficient SkillCoins. Need ${delta}, have ${user.skillCoinBalance}`);
  }

  user.skillCoinBalance -= delta;
  await user.save();

  await CoinLedger.create({
    userId,
    delta: -delta,
    reason,
    sessionId,
    balanceAfter: user.skillCoinBalance,
  });

  return user.skillCoinBalance;
};

/**
 * Get a user's current SkillCoin balance
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const getBalance = async (userId) => {
  const user = await User.findById(userId).select('skillCoinBalance').lean();
  if (!user) throw ApiError.notFound('User not found');
  return user.skillCoinBalance;
};

/**
 * Get ledger history for a user
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export const getLedger = async (userId, limit = 20) => {
  return CoinLedger.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sessionId', 'skillTag scheduledAt')
    .lean();
};
