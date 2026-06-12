import { Resend } from 'resend';

const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FROM = process.env.RESEND_FROM || 'Knorvex <notifications@knorvex.com>';

let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

/* ── Shared layout ──────────────────────────────────────────────────────── */
const wrap = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background:#0a0a0a; font-family:'Segoe UI',Arial,sans-serif; color:#e4e4e7; }
    .shell { max-width:540px; margin:40px auto; background:#111113; border:1px solid #27272a; border-radius:16px; overflow:hidden; }
    .top-bar { height:4px; background:linear-gradient(90deg,#6366f1,#8b5cf6); }
    .header { padding:28px 32px 20px; border-bottom:1px solid #1e1e21; }
    .logo { font-size:20px; font-weight:900; letter-spacing:-0.5px; color:#fff; text-decoration:none; }
    .logo span { color:#6366f1; }
    .body { padding:28px 32px; }
    h2 { margin:0 0 8px; font-size:18px; font-weight:700; color:#fff; }
    p  { margin:6px 0; font-size:14px; line-height:1.6; color:#a1a1aa; }
    .highlight { color:#fff; font-weight:600; }
    .btn { display:inline-block; margin-top:24px; padding:12px 28px; background:#6366f1;
           color:#fff; font-size:13px; font-weight:700; text-decoration:none;
           border-radius:10px; letter-spacing:0.2px; }
    .meta { margin-top:28px; padding-top:20px; border-top:1px solid #1e1e21;
            font-size:11px; color:#52525b; line-height:1.6; }
    .footer { padding:20px 32px; background:#0d0d10; border-top:1px solid #1e1e21;
              font-size:11px; color:#3f3f46; text-align:center; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="top-bar"></div>
    <div class="header">
      <a class="logo" href="${APP_URL}">Knor<span>vex</span></a>
    </div>
    <div class="body">${body}</div>
    <div class="footer">© ${new Date().getFullYear()} Knorvex · Peer Skill Exchange Platform<br/>
    You're receiving this because you have an account on Knorvex.</div>
  </div>
</body>
</html>`;

/* ── fire-and-forget helper ─────────────────────────────────────────────── */
async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await getResend().emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.warn('[email] send failed:', err?.message);
  }
}

/* ══ Notification emails ══════════════════════════════════════════════════ */

export async function sendFollowNotification(recipient, follower) {
  const profileUrl = `${APP_URL}/profile/${follower._id || follower.username || follower.name}`;
  await send({
    to: recipient.email,
    subject: `${follower.name} started following you on Knorvex`,
    html: wrap(`
      <h2>You have a new follower! 🎉</h2>
      <p><span class="highlight">${follower.name}</span> is now following you on Knorvex.</p>
      <p>Visit their profile to see their skills and connect back.</p>
      <a class="btn" href="${profileUrl}">View Profile</a>
      <div class="meta">If you don't recognise this user, you can block them from their profile page.</div>
    `),
  });
}

export async function sendSessionBookedNotification(host, learner, session) {
  const sessionUrl = `${APP_URL}/sessions`;
  const when = new Date(session.scheduledAt).toLocaleString('en-IN', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  });
  await send({
    to: host.email,
    subject: `New session booked: ${session.skillTag} with ${learner.name}`,
    html: wrap(`
      <h2>Session Booking Request</h2>
      <p><span class="highlight">${learner.name}</span> wants to learn
         <span class="highlight">${session.skillTag}</span> from you.</p>
      <p style="margin-top:16px;">📅 &nbsp;<span class="highlight">${when}</span></p>
      <p style="margin-top:8px;">Approve or decline from your sessions dashboard.</p>
      <a class="btn" href="${sessionUrl}">View Sessions</a>
      <div class="meta">Make sure you're ready 5 minutes before the scheduled time.
      The video room opens automatically at session start.</div>
    `),
  });
}

export async function sendSessionConfirmedNotification(learner, host, session) {
  const sessionUrl = `${APP_URL}/sessions`;
  const when = new Date(session.scheduledAt).toLocaleString('en-IN', {
    dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  });
  await send({
    to: learner.email,
    subject: `Session confirmed: ${session.skillTag} with ${host.name}`,
    html: wrap(`
      <h2>Your session is confirmed! ✅</h2>
      <p><span class="highlight">${host.name}</span> approved your
         <span class="highlight">${session.skillTag}</span> session.</p>
      <p style="margin-top:16px;">📅 &nbsp;<span class="highlight">${when}</span></p>
      <p style="margin-top:8px;">Join the call from your sessions dashboard at session time.</p>
      <a class="btn" href="${sessionUrl}">View Session</a>
      <div class="meta">Be ready 5 minutes before the scheduled time.</div>
    `),
  });
}

export async function sendSessionRatingNotification(recipient, partner, session) {
  const sessionsUrl = `${APP_URL}/sessions`;
  await send({
    to: recipient.email,
    subject: `Rate your session: ${session.skillTag} with ${partner.name}`,
    html: wrap(`
      <h2>How did your session go? ⭐</h2>
      <p>Your <span class="highlight">${session.skillTag}</span> session with
         <span class="highlight">${partner.name}</span> has ended.</p>
      <p style="margin-top:12px;">Submit your rating to complete the exchange and update their profile.</p>
      <a class="btn" href="${sessionsUrl}">Submit Rating</a>
      <div class="meta">Ratings help peers improve and keep the Knorvex community high-quality.</div>
    `),
  });
}

export async function sendMessageNotification(recipient, sender, preview, isRequest = false) {
  const messagesUrl = `${APP_URL}/messages`;
  const previewText = preview?.trim().substring(0, 80) || '(attachment)';
  const headline = isRequest
    ? `${sender.name} sent you a message request`
    : `New message from ${sender.name}`;

  await send({
    to: recipient.email,
    subject: headline,
    html: wrap(`
      <h2>${headline}</h2>
      <p style="margin-top:16px;padding:14px 18px;background:#18181b;border-radius:10px;
                 border-left:3px solid #6366f1;color:#d4d4d8;font-style:italic;">
        "${previewText}${previewText.length >= 80 ? '…' : ''}"
      </p>
      ${isRequest ? '<p style="margin-top:12px;">Accept the request to reply.</p>' : ''}
      <a class="btn" href="${messagesUrl}">Open Messages</a>
      <div class="meta">You're receiving this because someone messaged you on Knorvex.</div>
    `),
  });
}

export async function sendCommentNotification(recipient, commenter, post, commentPreview) {
  const postUrl = `${APP_URL}/feed`;
  const preview = commentPreview?.trim().substring(0, 100) || '';
  await send({
    to: recipient.email,
    subject: `${commenter.name} commented on your post`,
    html: wrap(`
      <h2>New comment on your post 💬</h2>
      <p><span class="highlight">${commenter.name}</span> commented on your
         <span class="highlight">${post.skillTag ? `#${post.skillTag}` : 'post'}</span>:</p>
      ${preview ? `
      <p style="margin-top:16px;padding:14px 18px;background:#18181b;border-radius:10px;
                 border-left:3px solid #6366f1;color:#d4d4d8;font-style:italic;">
        "${preview}${preview.length >= 100 ? '…' : ''}"
      </p>` : ''}
      <a class="btn" href="${postUrl}">View Post</a>
      <div class="meta">You're receiving this because someone commented on your post.</div>
    `),
  });
}
