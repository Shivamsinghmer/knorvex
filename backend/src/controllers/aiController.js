import User from '../models/User.js';
import Skill from '../models/Skill.js';
import SkillRequest from '../models/SkillRequest.js';
import { cache } from '../config/redis.js';
import { scoreCompatibility, buildProfileSummary, buildPrepPrompt, buildSummaryPrompt, rankSkillRequests } from '../services/aiService.js';
import Session from '../models/Session.js';
import ApiError from '../utils/ApiError.js';
import { z } from 'zod';

// GET /api/ai/matches — top 5 AI-matched users (cached 10min)
export const getMatches = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `matches:${userId}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const [mySkills, allUsers] = await Promise.all([
      Skill.find({ userId: req.user._id, isActive: true }).lean(),
      User.find({ _id: { $ne: req.user._id }, isActive: true, isPublic: true })
        .select('-passwordHash -blockedUsers')
        .limit(50)
        .lean(),
    ]);

    // Filter out blocked users
    const blockedSet = new Set(req.user.blockedUsers?.map((id) => id.toString()) || []);
    const candidates = allUsers.filter((u) => !blockedSet.has(u._id.toString()));

    // Score each candidate
    const myProfile = { user: req.user.toObject(), skills: mySkills };
    const scored = await Promise.all(
      candidates.slice(0, 20).map(async (candidate) => {
        const candidateSkills = await Skill.find({ userId: candidate._id, isActive: true }).lean();
        const result = await scoreCompatibility(myProfile, { user: candidate, skills: candidateSkills });
        return {
          user: candidate,
          skills: candidateSkills,
          compatibilityScore: result.score,
          reason: result.reason,
        };
      })
    );

    // Sort by score and take top 5
    const top5 = scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 5);

    await cache.set(cacheKey, top5, 600); // 10-minute TTL
    res.json({ success: true, data: top5 });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/profile-summary — regenerate AI summary for current user
export const regenerateProfileSummary = async (req, res, next) => {
  try {
    const skills = await Skill.find({ userId: req.user._id, isActive: true });
    const summary = await buildProfileSummary(req.user, skills);
    req.user.aiSummary = summary;
    await req.user.save();
    res.json({ success: true, data: { aiSummary: summary } });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/prep/:sessionId — 2-min readiness prep
export const getSessionPrep = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cacheKey = `session:prep:${sessionId}`;

    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const session = await Session.findById(sessionId)
      .populate('hostId')
      .populate('learnerId');
    if (!session) throw ApiError.notFound('Session not found');

    const userId = req.user._id.toString();
    const isHost = session.hostId._id.toString() === userId;
    const isLearner = session.learnerId._id.toString() === userId;
    if (!isHost && !isLearner) throw ApiError.forbidden('Not a participant');

    const [hostSkills, learnerSkills] = await Promise.all([
      Skill.find({ userId: session.hostId._id, isActive: true }).lean(),
      Skill.find({ userId: session.learnerId._id, isActive: true }).lean(),
    ]);

    const prep = await buildPrepPrompt(session, session.hostId, session.learnerId, hostSkills, learnerSkills);

    await cache.set(cacheKey, prep, 1800); // 30-min TTL
    const myPrep = isHost ? prep.hostPrep : prep.learnerPrep;
    res.json({ success: true, data: { prep: myPrep, full: prep } });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/summary/:sessionId — post-session AI notes
export const getSessionSummary = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('hostId', 'name')
      .populate('learnerId', 'name');
    if (!session) throw ApiError.notFound('Session not found');

    if (session.aiSummary) {
      return res.json({ success: true, data: { summary: session.aiSummary } });
    }

    const summary = await buildSummaryPrompt(session, session.hostId, session.learnerId);
    session.aiSummary = summary;
    await session.save();

    res.json({ success: true, data: { summary } });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/request-board — AI-ranked skill requests matching user's teach skills
export const getRankedRequestBoard = async (req, res, next) => {
  try {
    const [requests, mySkills] = await Promise.all([
      SkillRequest.find({ isOpen: true })
        .populate('userId', 'name avatar rank')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Skill.find({ userId: req.user._id, direction: 'teach', isActive: true }).lean(),
    ]);

    const ranked = await rankSkillRequests(requests, mySkills);
    res.json({ success: true, data: ranked });
  } catch (err) {
    next(err);
  }
};

export const createSkillRequestSchema = z.object({
  skillName: z.string().min(1).max(100),
  description: z.string().min(5).max(500),
  urgency: z.enum(['casual', 'soon', 'urgent']).optional().default('casual'),
  coinOffer: z.number().int().min(10).max(500).optional().default(50),
});

export const createSkillRequest = async (req, res, next) => {
  try {
    const { skillName, description, urgency, coinOffer = 50 } = req.body;
    
    // Check balance
    if (req.user.skillCoinBalance < 10) {
      throw ApiError.badRequest('Insufficient SkillCoins to post a request (minimum 10 required)');
    }

    const request = await SkillRequest.create({
      userId: req.user._id,
      skillName,
      description,
      urgency,
      coinOffer,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};
