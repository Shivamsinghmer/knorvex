import { verifyAccessToken } from '../utils/jwt.js';
import { cache } from '../config/redis.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

/**
 * Auth middleware — verifies JWT access token and attaches req.user
 * Also checks Redis blacklist for logged-out tokens
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.slice(7);

    // Check blacklist
    const blacklisted = await cache.isBlacklisted(token);
    if (blacklisted) {
      throw ApiError.unauthorized('Token has been revoked');
    }

    // Verify signature + expiry
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired');
      }
      throw ApiError.unauthorized('Invalid token');
    }

    if (payload.type !== 'access') {
      throw ApiError.unauthorized('Invalid token type');
    }

    // Attach user to request
    const user = await User.findById(payload.sub).select('-passwordHash -blockedUsers');
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — attaches req.user if token present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const blacklisted = await cache.isBlacklisted(token);
    if (blacklisted) return next();

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
  } catch {
    // Ignore errors — optional auth
  }
  next();
};

export default auth;
