import { Queue, Worker } from 'bullmq';
import { bullConnection } from '../config/redis.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { buildSummaryPrompt } from '../services/aiService.js';
import { sendSocketNotification } from '../services/notificationService.js';

// ─── Redis connection options for BullMQ ───────────────────────────────────────
// We use dedicated connection options for BullMQ queues/workers to avoid sharing issues.
const connection = bullConnection;

// ─── Lazy Queue ────────────────────────────────────────────────────────────────
let _postSessionQueue = null;

export const getPostSessionQueue = () => {
  if (!_postSessionQueue) {
    _postSessionQueue = new Queue('post-session', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    _postSessionQueue.on('error', (err) => {
      console.warn('⚠️  Post-session queue error (Redis unavailable):', err.message);
    });
  }
  return _postSessionQueue;
};

export const postSessionQueue = new Proxy({}, {
  get: (_, prop) => getPostSessionQueue()[prop],
});

/**
 * Queue a post-session job after a session ends
 */
export const queuePostSessionJob = async (sessionId) => {
  try {
    await getPostSessionQueue().add('post-session', { sessionId }, { delay: 0 });
  } catch (err) {
    console.warn('⚠️  Could not queue post-session job (Redis unavailable):', err.message);
  }
};

/**
 * Queue a coin credit job after both users have rated each other
 */
export const queueCoinCreditJob = async (sessionId) => {
  try {
    await getPostSessionQueue().add('credit-coins', { sessionId });
  } catch (err) {
    console.warn('⚠️  Could not queue coin credit job (Redis unavailable):', err.message);
  }
};

// ─── Worker ────────────────────────────────────────────────────────────────────

export const startPostSessionWorker = () => {
  try {
    const worker = new Worker(
      'post-session',
      async (job) => {
        const { sessionId } = job.data;

        if (job.name === 'post-session') {
          await handlePostSession(sessionId);
        } else if (job.name === 'credit-coins') {
          await handleCreditCoins(sessionId);
        }
      },
      { connection, concurrency: 3 }
    );

    worker.on('error', (err) => {
      console.warn('⚠️  Post-session worker error:', err.message);
    });

    worker.on('failed', (job, err) => {
      console.error(`Post-session job ${job?.id} (${job?.name}) failed:`, err.message);
    });

    console.log('✅ Post-session worker started');
    return worker;
  } catch (err) {
    console.warn('⚠️  Post-session worker could not start (Redis unavailable):', err.message);
    return null;
  }
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

const handlePostSession = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('hostId', 'name email')
    .populate('learnerId', 'name email');

  if (!session) return console.warn(`Session ${sessionId} not found`);
  if (session.status !== 'pending_rating') return;

  console.log(`📝 Processing post-session for ${sessionId}`);

  // Generate AI summary
  try {
    const aiSummary = await buildSummaryPrompt(session, session.hostId, session.learnerId);
    session.aiSummary = aiSummary;
    await session.save();

    // Push AI summary to both users
    sendSocketNotification(session.hostId._id.toString(), 'session:summary', { sessionId, summary: aiSummary });
    sendSocketNotification(session.learnerId._id.toString(), 'session:summary', { sessionId, summary: aiSummary });
  } catch (err) {
    console.error('AI summary error:', err.message);
  }
};

const handleCreditCoins = async (sessionId) => {
  const session = await Session.findById(sessionId)
    .populate('hostId', 'name email avgRating rankScore rank')
    .populate('learnerId', 'name email avgRating rankScore rank');

  if (!session) return;
  if (session.status === 'completed') return; // Already processed

  console.log(`✅ Finalizing session ${sessionId} after both rated`);

  // Increment session counts for both participants
  await Promise.all([
    User.findByIdAndUpdate(session.hostId._id, { $inc: { totalSessionsTaught: 1 } }),
    User.findByIdAndUpdate(session.learnerId._id, { $inc: { totalSessionsLearned: 1 } }),
  ]);

  // Notify both users that session is fully complete
  sendSocketNotification(session.hostId._id.toString(), 'session:completed', {
    sessionId,
    message: `Your session on ${session.skillTag} is now complete.`,
  });
  sendSocketNotification(session.learnerId._id.toString(), 'session:completed', {
    sessionId,
    message: `Your session on ${session.skillTag} is now complete.`,
  });

  // Mark session as completed
  await Session.findByIdAndUpdate(sessionId, { status: 'completed' });
  console.log(`✅ Session ${sessionId} marked completed`);
};
