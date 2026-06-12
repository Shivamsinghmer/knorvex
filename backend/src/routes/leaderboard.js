import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { cache } from '../config/redis.js';

const router = express.Router();

// GET /api/leaderboard — top 50 by rankScore (cached 5min)
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'leaderboard:all';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const users = await User.find({ isActive: true, isPublic: true })
      .select('name avatar rank rankScore skillCoinBalance avgRating totalSessionsTaught totalSessionsLearned')
      .sort({ rankScore: -1 })
      .limit(50)
      .lean();

    await cache.set(cacheKey, users, 300); // 5-min TTL
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// GET /api/leaderboard/weekly — top 20 by sessions this week
router.get('/weekly', async (req, res, next) => {
  try {
    const cacheKey = 'leaderboard:weekly';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const results = await Session.aggregate([
      {
        $match: {
          status: 'completed',
          updatedAt: { $gte: weekAgo },
        },
      },
      {
        $group: {
          _id: '$hostId',
          weeklySessionsTaught: { $sum: 1 },
        },
      },
      { $sort: { weeklySessionsTaught: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          weeklySessionsTaught: 1,
          'user.name': 1,
          'user.avatar': 1,
          'user.rank': 1,
          'user.rankScore': 1,
          'user.avgRating': 1,
        },
      },
    ]);

    await cache.set(cacheKey, results, 300);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

export default router;
