import { Resend } from 'resend';
import twilio from 'twilio';

// ─── Email ────────────────────────────────────────────────────────────────────

let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

const FROM = process.env.RESEND_FROM || 'Knorvex <notifications@knorvex.com>';

export const sendEmail = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await getResend().emails.send({ from: FROM, to, subject, html });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Email send error to ${to}:`, err.message);
  }
};

// ─── SMS ──────────────────────────────────────────────────────────────────────

let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

/**
 * Send an SMS via Twilio
 * @param {string} to - Recipient phone number (E.164 format: +91XXXXXXXXXX)
 * @param {string} body - SMS text content
 */
export const sendSMS = async (to, body) => {
  if (!to || !process.env.TWILIO_ACCOUNT_SID) {
    console.warn('SMS skipped — Twilio not configured or no phone number');
    return;
  }
  try {
    const client = getTwilioClient();
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to,
    });
    console.log(`📱 SMS sent to ${to}`);
  } catch (err) {
    console.error(`SMS send error to ${to}:`, err.message);
  }
};

// ─── In-app / Socket notifications ───────────────────────────────────────────

let ioInstance = null;

/**
 * Store the Socket.io instance so the notification service can emit events
 * @param {import('socket.io').Server} io
 */
export const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Send a real-time notification to a specific user via Socket.io
 * @param {string} userId - MongoDB user ID (user room)
 * @param {string} event - Socket event name
 * @param {object} data - Event payload
 */
export const sendSocketNotification = (userId, event, data) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
};

// ─── Email Templates ──────────────────────────────────────────────────────────

export const templates = {
  sessionReminder: (userName, skillTag, scheduledAt, minutesBefore) => ({
    subject: `⏰ Session reminder: ${skillTag} in ${minutesBefore < 60 ? minutesBefore + ' minutes' : Math.round(minutesBefore / 60) + ' hours'}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0F0F13; color: #F1F0FF; padding: 32px; border-radius: 16px;">
        <h1 style="color: #818CF8; font-size: 24px; margin-bottom: 8px;">Knorvex</h1>
        <h2 style="font-size: 20px; margin-bottom: 16px;">Hi ${userName}! Your session is coming up 🚀</h2>
        <div style="background: #1A1A24; border: 1px solid #2E2E45; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0; color: #9794B5; font-size: 14px;">SKILL</p>
          <p style="margin: 4px 0 16px; font-size: 18px; font-weight: 700;">${skillTag}</p>
          <p style="margin: 0; color: #9794B5; font-size: 14px;">SCHEDULED AT</p>
          <p style="margin: 4px 0 0; font-size: 16px;">${new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/sessions" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open Session Dashboard</a>
        <p style="margin-top: 24px; color: #9794B5; font-size: 12px;">Knorvex — Learn. Teach. Grow.</p>
      </div>
    `,
  }),

  coinsCredit: (userName, amount, reason) => ({
    subject: `🪙 You earned ${amount} SkillCoins!`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0F0F13; color: #F1F0FF; padding: 32px; border-radius: 16px;">
        <h1 style="color: #818CF8;">Knorvex</h1>
        <h2>Hi ${userName}! You just earned SkillCoins 🎉</h2>
        <div style="background: #1A1A24; border: 1px solid #06B6D4; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #06B6D4; font-size: 40px; font-weight: 800; margin: 0;">+${amount}</p>
          <p style="color: #9794B5; margin: 8px 0 0;">SkillCoins</p>
          <p style="margin: 16px 0 0;">${reason}</p>
        </div>
      </div>
    `,
  }),
};
