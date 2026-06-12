import { Queue, Worker } from 'bullmq';
import { bullConnection } from '../config/redis.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { sendEmail, sendSocketNotification, templates } from '../services/notificationService.js';
import { buildPrepPrompt } from '../services/aiService.js';
import Skill from '../models/Skill.js';

// ─── Redis connection options for BullMQ ───────────────────────────────────────
// We use dedicated connection options for BullMQ queues/workers to avoid sharing issues.
const connection = bullConnection;

// ─── Lazy Queue (only used when Redis is up) ───────────────────────────────────
let _reminderQueue = null;

export const getReminderQueue = () => {
  if (!_reminderQueue) {
    _reminderQueue = new Queue('reminders', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    _reminderQueue.on('error', (err) => {
      console.warn('⚠️  Reminder queue error (Redis unavailable):', err.message);
    });
  }
  return _reminderQueue;
};

// Keep backward compat export (lazy evaluated)
export const reminderQueue = new Proxy({}, {
  get: (_, prop) => getReminderQueue()[prop],
});

/**
 * Schedule all reminder jobs for a session when it's booked
 */
export const scheduleReminders = async (session, host, learner) => {
  try {
    const queue = getReminderQueue();
    const scheduledMs = new Date(session.scheduledAt).getTime();
    const now = Date.now();

    const reminders = [
      { delay: scheduledMs - now - 24 * 60 * 60 * 1000, type: '24hr' },
      { delay: scheduledMs - now - 2 * 60 * 60 * 1000, type: '2hr' },
      { delay: scheduledMs - now - 30 * 60 * 1000, type: '30min' },
      { delay: scheduledMs - now - 2 * 60 * 1000, type: '2min' },
    ];

    for (const reminder of reminders) {
      if (reminder.delay > 0) {
        await queue.add(
          'session-reminder',
          {
            sessionId: session._id.toString(),
            hostId: host._id.toString(),
            learnerId: learner._id.toString(),
            hostEmail: host.email,
            learnerEmail: learner.email,
            hostName: host.name,
            learnerName: learner.name,
            skillTag: session.skillTag,
            scheduledAt: session.scheduledAt,
            type: reminder.type,
          },
          { delay: reminder.delay }
        );
      }
    }
  } catch (err) {
    console.warn('⚠️  Could not schedule reminders (Redis unavailable):', err.message);
  }
};

// ─── Worker ────────────────────────────────────────────────────────────────────

export const startReminderWorker = () => {
  try {
    const worker = new Worker(
      'reminders',
      async (job) => {
        const { type, hostId, learnerId, hostEmail, learnerEmail, hostName, learnerName, skillTag, scheduledAt, sessionId } = job.data;

        console.log(`⏰ Processing ${type} reminder for session ${sessionId}`);

        const session = await Session.findById(sessionId);
        // Skip if session was cancelled
        if (!session || ['cancelled', 'completed'].includes(session.status)) return;

        if (type === '24hr' || type === '2hr') {
          // Email both users
          const minutesBefore = type === '24hr' ? 24 * 60 : 120;
          const { subject: hostSubject, html: hostHtml } = templates.sessionReminder(hostName, skillTag, scheduledAt, minutesBefore);
          const { subject: learnerSubject, html: learnerHtml } = templates.sessionReminder(learnerName, skillTag, scheduledAt, minutesBefore);

          await Promise.all([
            sendEmail(hostEmail, hostSubject, hostHtml),
            sendEmail(learnerEmail, learnerSubject, learnerHtml),
          ]);
        }

        if (type === '2hr' || type === '30min') {
          // Socket.io notification
          const msgText = `Knorvex reminder: Your session on "${skillTag}" starts in ${type === '2hr' ? '2 hours' : '30 minutes'}. Be ready!`;
          const [host, learner] = await Promise.all([
            User.findById(hostId).select('phone').lean(),
            User.findById(learnerId).select('phone').lean(),
          ]);
          sendSocketNotification(hostId, 'notification:reminder', { message: msgText, sessionId, type });
          sendSocketNotification(learnerId, 'notification:reminder', { message: msgText, sessionId, type });
        }

        if (type === '2min') {
          // AI prep push via Socket.io
          try {
            const [host, learner, hostSkills, learnerSkills] = await Promise.all([
              User.findById(hostId).lean(),
              User.findById(learnerId).lean(),
              Skill.find({ userId: hostId, isActive: true }).lean(),
              Skill.find({ userId: learnerId, isActive: true }).lean(),
            ]);

            const prep = await buildPrepPrompt(session, host, learner, hostSkills, learnerSkills);

            sendSocketNotification(hostId, 'session:prep', { sessionId, prep: prep.hostPrep });
            sendSocketNotification(learnerId, 'session:prep', { sessionId, prep: prep.learnerPrep });

            // Mark AI prep as sent
            await Session.findByIdAndUpdate(sessionId, { aiPrepSent: true });
          } catch (err) {
            console.error('AI prep error:', err.message);
          }
        }
      },
      { connection, concurrency: 5 }
    );

    worker.on('error', (err) => {
      console.warn('⚠️  Reminder worker error:', err.message);
    });

    worker.on('failed', (job, err) => {
      console.error(`Reminder job ${job?.id} failed:`, err.message);
    });

    console.log('✅ Reminder worker started');
    return worker;
  } catch (err) {
    console.warn('⚠️  Reminder worker could not start (Redis unavailable):', err.message);
    return null;
  }
};
