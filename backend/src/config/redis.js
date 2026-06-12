import Redis from 'ioredis';

let _redisOfflineWarned = false;

// Detect if using Upstash (rediss:// = TLS required)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isTLS = redisUrl.startsWith('rediss://');

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  // Upstash requires TLS; local Redis does not
  tls: isTLS ? {} : undefined,
  retryStrategy: (times) => {
    if (times >= 3) {
      if (!_redisOfflineWarned) {
        console.warn('⚠️  Redis unavailable — caching and job queues disabled. App continues without Redis.');
        _redisOfflineWarned = true;
      }
      return null; // Stop retrying
    }
    return Math.min(times * 300, 1000);
  },
  lazyConnect: true,
  enableOfflineQueue: false,
});

// Build connection options for BullMQ (which manages its own connection pool)
const parsedUrl = new URL(redisUrl);
export const bullConnection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port, 10) || 6379,
  username: parsedUrl.username || undefined,
  password: parsedUrl.password || undefined,
  tls: isTLS ? {} : undefined,
  maxRetriesPerRequest: null,
};

redisClient.on('connect', () => {
  _redisOfflineWarned = false;
  console.log('✅ Redis connected');
});
// Swallow error events — retryStrategy warning is enough
redisClient.on('error', () => {});

// ─── Cache Helpers ────────────────────────────────────────────────────────────

export const cache = {
  /**
   * Get a cached value (auto-parsed from JSON)
   */
  get: async (key) => {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set a cached value with optional TTL in seconds
   */
  set: async (key, value, ttlSeconds = 600) => {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Silently skip if Redis is unavailable
    }
  },

  /**
   * Delete a cached key
   */
  del: async (key) => {
    try {
      await redisClient.del(key);
    } catch {
      // Silently skip if Redis is unavailable
    }
  },

  /**
   * Blacklist a JWT token until its expiry
   * @param {string} token - the raw JWT string
   * @param {number} expiresInSeconds - seconds until the token would have expired
   */
  blacklist: async (token, expiresInSeconds = 900) => {
    try {
      await redisClient.setex(`bl:${token}`, expiresInSeconds, '1');
    } catch {
      // Silently skip if Redis is unavailable
    }
  },

  /**
   * Check if a JWT token is blacklisted
   */
  isBlacklisted: async (token) => {
    try {
      const result = await redisClient.get(`bl:${token}`);
      return result === '1';
    } catch {
      return false; // Fail open — allow token if Redis is down
    }
  },
};

export default redisClient;
