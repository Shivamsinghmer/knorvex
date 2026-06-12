import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import CoinLedger from '../models/CoinLedger.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, decodeToken } from '../utils/jwt.js';
import { cache } from '../config/redis.js';
import ApiError from '../utils/ApiError.js';
import { buildProfileSummary } from '../services/aiService.js';
import { createStreamUser } from '../services/streamService.js';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  skills: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        category: z.string().optional().default('Other'),
        direction: z.enum(['teach', 'learn']),
        level: z.enum(['Beginner', 'Intermediate', 'Expert']),
      })
    )
    .optional()
    .default([]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, skills } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ name, email, passwordHash });

    // Create skills (if provided)
    if (skills.length > 0) {
      const skillDocs = skills.map((s) => ({ ...s, userId: user._id }));
      await Skill.insertMany(skillDocs);
    }

    // Register with Stream.io (non-blocking — fail silently on missing API keys)
    try {
      const streamUserId = await createStreamUser(
        user._id.toString(),
        user.name,
        user.avatar
      );
      user.streamUserId = streamUserId;
    } catch (streamErr) {
      console.warn('Stream.io user creation skipped:', streamErr.message);
    }

    // Generate AI bio summary (non-blocking)
    try {
      const userSkills = await Skill.find({ userId: user._id });
      user.aiSummary = await buildProfileSummary(user, userSkills);
    } catch (aiErr) {
      console.warn('AI summary skipped:', aiErr.message);
    }

    await user.save();

    // Record the welcome SkillCoin grant in the ledger
    await CoinLedger.create({
      userId: user._id,
      delta: 100,
      reason: 'Welcome bonus: 100 SkillCoins for joining Knorvex',
      sessionId: null,
      balanceAfter: 100,
    });

    // Issue tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) throw ApiError.unauthorized('Invalid email or password');

    const valid = await user.comparePassword(password);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    // Update lastSeen
    user.lastSeen = new Date();
    await user.save();

    // Ensure user is registered/synced in Stream.io (handles seeded users)
    try {
      const streamUserId = await createStreamUser(
        user._id.toString(),
        user.name,
        user.avatar
      );
      if (!user.streamUserId) {
        user.streamUserId = streamUserId;
        await user.save();
      }
    } catch (streamErr) {
      console.warn('Stream.io user sync skipped on login:', streamErr.message);
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw ApiError.badRequest('Refresh token required');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid token type');

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('User not found');

    const newAccessToken = signAccessToken(user._id);

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Blacklists the access token in Redis until it would have expired
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.token;
    const decoded = decodeToken(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await cache.blacklist(token, expiresIn);
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  const userSkills = await Skill.find({ userId: req.user._id, isActive: true }).lean();
  res.json({
    success: true,
    data: { user: req.user.toSafeObject(), skills: userSkills },
  });
};
