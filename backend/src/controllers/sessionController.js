import Session from '../models/Session.js';
import Rating from '../models/Rating.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';
import { createCall, addCallMembers, generateUserToken, generateChatToken, createChatChannel, endCall, createStreamUser } from '../services/streamService.js';
import { debitCoins, creditCoins } from '../services/coinService.js';
import { scheduleReminders } from '../jobs/reminderJob.js';
import { queuePostSessionJob, queueCoinCreditJob } from '../jobs/postSessionJob.js';
import { sendSocketNotification } from '../services/notificationService.js';
import { sendSessionBookedNotification, sendSessionConfirmedNotification, sendSessionRatingNotification } from '../services/emailService.js';
import { z } from 'zod';

export const bookSessionSchema = z.object({
  hostId: z.string().min(1),
  skillTag: z.string().min(1).max(100),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(30).max(180).optional().default(60),
  isPaidSession: z.boolean().optional().default(false),
  paidAmount: z.number().optional().default(0),
});

export const rateSessionSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  engagement: z.number().int().min(1).max(5),
  overall: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/sessions — book a session
export const bookSession = async (req, res, next) => {
  try {
    const { hostId, skillTag, scheduledAt, durationMinutes, isPaidSession, paidAmount } = req.body;
    const learnerId = req.user._id;

    if (hostId === learnerId.toString()) throw ApiError.badRequest('Cannot book a session with yourself');

    const host = await User.findById(hostId);
    if (!host || !host.isActive) throw ApiError.notFound('Host not found');

    const BOOKING_COST = 10;

    // Check learner has enough coins for barter sessions
    if (!isPaidSession && req.user.skillCoinBalance < BOOKING_COST) {
      throw ApiError.badRequest(`Insufficient SkillCoins. You need ${BOOKING_COST} SC to book a session.`);
    }

    // Create session first so we have a sessionId for the ledger entries
    const session = await Session.create({
      hostId,
      learnerId,
      skillTag,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      isPaidSession,
      paidAmount,
      coinsReward: BOOKING_COST,
      participants: [
        { userId: hostId, role: 'host' },
        { userId: learnerId, role: 'learner' },
      ],
    });

    // Transfer coins: deduct from learner, credit to host, notify both
    if (!isPaidSession) {
      const [, newHostBalance] = await Promise.all([
        debitCoins(learnerId, BOOKING_COST, `Booked session with ${host.name}: ${skillTag}`, session._id),
        creditCoins(hostId, BOOKING_COST, `Session booked by ${req.user.name}: ${skillTag}`, session._id),
      ]);
      // Notify host of new coin balance
      sendSocketNotification(hostId.toString(), 'coins:credited', {
        amount: BOOKING_COST,
        newBalance: newHostBalance,
        reason: `Session booked by ${req.user.name}: ${skillTag}`,
      });
      // Update host's rank score for earning coins
      const hostUser = await User.findById(hostId);
      if (hostUser) await hostUser.updateRankScore(BOOKING_COST);
    }

    // Schedule BullMQ reminders
    try {
      await scheduleReminders(session, host, req.user);
    } catch (e) {
      console.warn('Could not schedule reminders:', e.message);
    }

    // Notify host — socket (real-time) + email
    sendSocketNotification(hostId, 'session:booked', {
      sessionId: session._id,
      learnerName: req.user.name,
      skillTag,
    });

    if (host.email) {
      sendSessionBookedNotification(
        { name: host.name, email: host.email },
        { name: req.user.name },
        { _id: session._id, skillTag, scheduledAt: session.scheduledAt },
      );
    }

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions — list user's sessions
export const listSessions = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    const filter = {
      $or: [{ hostId: userId }, { learnerId: userId }],
    };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const query = Session.find(filter)
      .populate('hostId', 'name avatar rank')
      .populate('learnerId', 'name avatar rank')
      .sort({ scheduledAt: -1 });

    const result = await paginate(query, Session, filter, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/upcoming
export const getUpcoming = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({
      $or: [{ hostId: userId }, { learnerId: userId }],
      status: { $in: ['pending', 'confirmed'] },
      scheduledAt: { $gte: new Date() },
    })
      .populate('hostId', 'name avatar rank')
      .populate('learnerId', 'name avatar rank')
      .sort({ scheduledAt: 1 })
      .limit(10)
      .lean();

    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/:sessionId
export const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('hostId', 'name avatar rank bio')
      .populate('learnerId', 'name avatar rank bio');

    if (!session) throw ApiError.notFound('Session not found');

    const userId = req.user._id.toString();
    const isParticipant =
      session.hostId._id.toString() === userId || session.learnerId._id.toString() === userId;
    if (!isParticipant) throw ApiError.forbidden('Not a participant');

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// PUT /api/sessions/:sessionId/confirm
export const confirmSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');
    if (session.hostId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Only the host can confirm');
    }
    if (session.status !== 'pending') throw ApiError.badRequest('Session cannot be confirmed');

    session.status = 'confirmed';
    await session.save();

    sendSocketNotification(session.learnerId.toString(), 'session:confirmed', {
      sessionId: session._id,
      skillTag: session.skillTag,
    });

    // Email learner that host approved
    const learnerUser = await User.findById(session.learnerId).select('name email').lean();
    if (learnerUser?.email) {
      sendSessionConfirmedNotification(
        { name: learnerUser.name, email: learnerUser.email },
        { name: req.user.name },
        session,
      );
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/:sessionId/start — create Stream.io call
export const startSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');

    const userId = req.user._id.toString();
    if (session.hostId.toString() !== userId && session.learnerId.toString() !== userId) {
      throw ApiError.forbidden('Not a participant');
    }

    if (!['confirmed', 'pending', 'active'].includes(session.status)) {
      throw ApiError.badRequest(`Session cannot be started (status: ${session.status})`);
    }

    // Ensure both users are registered in Stream.io
    try {
      const [hostUser, learnerUser] = await Promise.all([
        User.findById(session.hostId),
        User.findById(session.learnerId),
      ]);
      if (hostUser) {
        await createStreamUser(hostUser._id.toString(), hostUser.name, hostUser.avatar);
      }
      if (learnerUser) {
        await createStreamUser(learnerUser._id.toString(), learnerUser.name, learnerUser.avatar);
      }
    } catch (userSyncErr) {
      console.warn('Stream user synchronization skipped:', userSyncErr.message);
    }

    // Create Stream Video call
    let streamCallId = session.streamCallId;
    if (!streamCallId) {
      try {
        const { callId } = await createCall(session._id.toString(), userId);
        streamCallId = callId;

        // Add members
        await addCallMembers(callId, [session.hostId.toString(), session.learnerId.toString()]);

        session.streamCallId = callId;
        session.status = 'active';
        session.participants = session.participants.map((p) => {
          if (p.userId.toString() === userId) p.joinedAt = new Date();
          return p;
        });
        await session.save();

        // Create the Stream Chat channel server-side so both users are members
        try {
          await createChatChannel(session._id.toString(), [
            session.hostId.toString(),
            session.learnerId.toString(),
          ]);
        } catch (chatErr) {
          console.warn('Stream Chat channel creation skipped:', chatErr.message);
        }
      } catch (streamErr) {
        console.warn('Stream call creation failed:', streamErr.message);
        // Allow session to proceed without Stream in dev mode
        session.status = 'active';
        await session.save();
      }
    } else {
      // Session already active, mark joinedAt for the current participant if not set
      let modified = false;
      session.participants = session.participants.map((p) => {
        if (p.userId.toString() === userId && !p.joinedAt) {
          p.joinedAt = new Date();
          modified = true;
        }
        return p;
      });
      if (modified) {
        await session.save();
      }

      // Ensure the joining user is a member of the chat channel
      // (handles the case where the second user joins an already-active session)
      try {
        await createChatChannel(session._id.toString(), [
          session.hostId.toString(),
          session.learnerId.toString(),
        ]);
      } catch (chatErr) {
        console.warn('Stream Chat channel sync skipped:', chatErr.message);
      }
    }

    // Generate user token (video) and dedicated chat token
    let userToken = null;
    let chatToken = null;
    try {
      userToken = generateUserToken(userId);
      chatToken = generateChatToken(userId);
    } catch { /* Stream not configured */ }

    res.json({
      success: true,
      data: {
        session,
        streamCallId,
        userToken,
        chatToken,
        streamApiKey: process.env.STREAM_API_KEY || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/:sessionId/end
export const endSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');
    if (session.status !== 'active') throw ApiError.badRequest('Session is not active');

    const userId = req.user._id.toString();
    if (session.hostId.toString() !== userId && session.learnerId.toString() !== userId) {
      throw ApiError.forbidden('Not a participant');
    }

    // End Stream call
    if (session.streamCallId) {
      await endCall(session.streamCallId).catch(() => {});
    }

    session.status = 'pending_rating';
    await session.save();

    // Queue post-session job
    await queuePostSessionJob(session._id.toString());

    // Notify both users to rate (socket + email)
    sendSocketNotification(session.hostId.toString(), 'session:rate_required', {
      sessionId: session._id,
    });
    sendSocketNotification(session.learnerId.toString(), 'session:rate_required', {
      sessionId: session._id,
    });

    const [hostUser, learnerUser] = await Promise.all([
      User.findById(session.hostId).select('name email').lean(),
      User.findById(session.learnerId).select('name email').lean(),
    ]);
    if (hostUser?.email) {
      sendSessionRatingNotification(
        { name: hostUser.name, email: hostUser.email },
        { name: learnerUser?.name || 'your peer' },
        session,
      );
    }
    if (learnerUser?.email) {
      sendSessionRatingNotification(
        { name: learnerUser.name, email: learnerUser.email },
        { name: hostUser?.name || 'your peer' },
        session,
      );
    }

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/:sessionId/rate
export const rateSession = async (req, res, next) => {
  try {
    const { clarity, punctuality, engagement, overall, comment } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');
    if (!['pending_rating', 'completed'].includes(session.status)) throw ApiError.badRequest('Session is not awaiting ratings');

    const userId = req.user._id.toString();
    const isHost = session.hostId.toString() === userId;
    const isLearner = session.learnerId.toString() === userId;
    if (!isHost && !isLearner) throw ApiError.forbidden('Not a participant');

    const rateeId = isHost ? session.learnerId : session.hostId;

    // Check duplicate rating
    const existing = await Rating.findOne({ sessionId: session._id, raterId: req.user._id });
    if (existing) throw ApiError.conflict('You have already rated this session');

    await Rating.create({ sessionId: session._id, raterId: req.user._id, rateeId, clarity, punctuality, engagement, overall, comment });

    // Update ratee's average rating and rank score immediately
    const avgOverall = (clarity + punctuality + engagement + overall) / 4;
    const rateeUser = await User.findById(rateeId);
    await rateeUser.addRating(avgOverall);
    // Rank score update: coinsEarned=0 so only avgRating contributes this time
    await rateeUser.updateRankScore(0);

    // Notify ratee of profile update so frontend can refresh
    sendSocketNotification(rateeId.toString(), 'profile:updated', {
      avgRating: rateeUser.avgRating,
      rankScore: rateeUser.rankScore,
      rank: rateeUser.rank,
    });

    // Track who rated
    if (isHost) session.hostRated = true;
    else session.learnerRated = true;
    await session.save();

    // When both have rated: finalize session (no coin credit — transferred at booking)
    if (session.hostRated && session.learnerRated) {
      await queueCoinCreditJob(session._id.toString());
    }

    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/:sessionId/token
export const getSessionToken = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');

    const userId = req.user._id.toString();
    if (session.hostId.toString() !== userId && session.learnerId.toString() !== userId) {
      throw ApiError.forbidden('Not a participant');
    }

    let userToken = null;
    try {
      userToken = generateUserToken(userId);
    } catch { /* Stream not configured */ }

    res.json({
      success: true,
      data: {
        userToken,
        streamCallId: session.streamCallId,
        streamApiKey: process.env.STREAM_API_KEY || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/:sessionId/cancel
export const cancelSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) throw ApiError.notFound('Session not found');

    const userId = req.user._id.toString();
    if (session.hostId.toString() !== userId && session.learnerId.toString() !== userId) {
      throw ApiError.forbidden('Not a participant');
    }

    if (!['pending', 'confirmed'].includes(session.status)) {
      throw ApiError.badRequest('Session cannot be cancelled');
    }

    session.status = 'cancelled';
    session.cancelledBy = req.user._id;
    session.cancelReason = req.body.reason || '';
    await session.save();

    // Refund learner and claw back from host for barter sessions
    if (!session.isPaidSession) {
      const BOOKING_COST = session.coinsReward || 10;
      await creditCoins(session.learnerId, BOOKING_COST, `Refund: cancelled session - ${session.skillTag}`, session._id);
      try {
        await debitCoins(session.hostId, BOOKING_COST, `Refund issued to learner: cancelled session - ${session.skillTag}`, session._id);
      } catch {
        // Host may have already spent the coins; refund the learner regardless
      }
    }

    // Notify other party
    const otherId = userId === session.hostId.toString()
      ? session.learnerId.toString()
      : session.hostId.toString();
    sendSocketNotification(otherId, 'session:cancelled', { sessionId: session._id });

    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
};
