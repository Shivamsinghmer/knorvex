import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * Sign an access token for the given userId
 * @returns {string} JWT string
 */
export const signAccessToken = (userId) => {
  return jwt.sign({ sub: userId.toString(), type: 'access' }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
};

/**
 * Sign a refresh token for the given userId
 * @returns {string} JWT string
 */
export const signRefreshToken = (userId) => {
  return jwt.sign({ sub: userId.toString(), type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
};

/**
 * Verify an access token
 * @returns {{ sub: string, type: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

/**
 * Verify a refresh token
 * @returns {{ sub: string, type: string, iat: number, exp: number }}
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

/**
 * Decode without verifying (for getting exp to set Redis TTL)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
