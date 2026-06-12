import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Follow from '../models/Follow.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';
import { cache } from '../config/redis.js';
import { buildProfileSummary } from '../services/aiService.js';
import { sendFollowNotification } from '../services/emailService.js';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export const addSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().optional().default('Other'),
  direction: z.enum(['teach', 'learn']),
  level: z.enum(['Beginner', 'Intermediate', 'Expert']),
  description: z.string().max(500).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

// GET /api/users — search/browse users
export const getUsers = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, isPublic: true };

    if (search) {
      filter.$text = { $search: search };
    }

    const query = User.find(filter).select('-passwordHash -blockedUsers').sort({ rankScore: -1 });
    const result = await paginate(query, User, filter, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash -blockedUsers');
    if (!user || !user.isActive) throw ApiError.notFound('User not found');
    if (!user.isPublic && req.user?._id.toString() !== req.params.userId) {
      throw ApiError.forbidden('This profile is private');
    }
    const skills = await Skill.find({ userId: user._id, isActive: true }).lean();
    res.json({ success: true, data: { user: user.toSafeObject(), skills } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/me
export const updateProfile = async (req, res, next) => {
  try {
    Object.assign(req.user, req.body);
    await req.user.save();
    // Bust AI match cache
    await cache.del(`matches:${req.user._id}`);
    res.json({ success: true, data: { user: req.user.toSafeObject() } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me
export const deleteMe = async (req, res, next) => {
  try {
    req.user.isActive = false;
    await req.user.save();
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:userId/follow
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) throw ApiError.badRequest('Cannot follow yourself');

    const target = await User.findById(userId);
    if (!target || !target.isActive) throw ApiError.notFound('User not found');

    await Follow.create({ followerId: req.user._id, followingId: userId });

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(userId, { $inc: { followerCount: 1 } }),
    ]);

    // Fire-and-forget — never awaited so it can't delay the response
    if (target.email) {
      sendFollowNotification(
        { name: target.name, email: target.email },
        { name: req.user.name, username: req.user.username || req.user.name },
      );
    }

    res.json({ success: true, message: 'Following' });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, message: 'Already following' });
    next(err);
  }
};

// DELETE /api/users/:userId/follow
export const unfollowUser = async (req, res, next) => {
  try {
    const result = await Follow.findOneAndDelete({
      followerId: req.user._id,
      followingId: req.params.userId,
    });
    if (result) {
      await Promise.all([
        User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } }),
        User.findByIdAndUpdate(req.params.userId, { $inc: { followerCount: -1 } }),
      ]);
    }
    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/followers
export const getFollowers = async (req, res, next) => {
  try {
    const follows = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'name avatar rank rankScore')
      .lean();
    res.json({ success: true, data: follows.map((f) => f.followerId) });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/following
export const getFollowing = async (req, res, next) => {
  try {
    const follows = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'name avatar rank rankScore')
      .lean();
    res.json({ success: true, data: follows.map((f) => f.followingId) });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/me/skills
export const getMySkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ userId: req.user._id, isActive: true }).lean();
    res.json({ success: true, data: skills });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/skills
export const addSkill = async (req, res, next) => {
  try {
    const skill = await Skill.create({ ...req.body, userId: req.user._id });
    // Regenerate AI summary
    try {
      const allSkills = await Skill.find({ userId: req.user._id, isActive: true });
      req.user.aiSummary = await buildProfileSummary(req.user, allSkills);
      await req.user.save();
      await cache.del(`matches:${req.user._id}`);
    } catch { /* non-fatal */ }
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me/skills/:skillId
export const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.skillId, userId: req.user._id });
    if (!skill) throw ApiError.notFound('Skill not found');
    skill.isActive = false;
    await skill.save();
    res.json({ success: true, message: 'Skill removed' });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:userId/block
export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!req.user.blockedUsers.includes(userId)) {
      req.user.blockedUsers.push(userId);
      await req.user.save();
    }
    // Also unfollow
    await Follow.deleteMany({
      $or: [
        { followerId: req.user._id, followingId: userId },
        { followerId: userId, followingId: req.user._id },
      ],
    });
    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:userId/block
export const unblockUser = async (req, res, next) => {
  try {
    req.user.blockedUsers = req.user.blockedUsers.filter(
      (id) => id.toString() !== req.params.userId
    );
    await req.user.save();
    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    next(err);
  }
};
