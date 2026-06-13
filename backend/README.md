# Knorvex — Backend

Express API server for the Knorvex peer-to-peer skill exchange platform. Includes REST API, Socket.io real-time layer, BullMQ background job workers, and integrations with Groq AI, Stream.io, Cloudinary, and Resend.

---

## Tech Stack

| | |
|---|---|
| Runtime | Node.js ≥ 18 (ES Modules) |
| Framework | Express 4 |
| Database | MongoDB (Mongoose 8) |
| Cache / Queues | Redis — ioredis + BullMQ 5 |
| Real-time | Socket.io 4 |
| AI | Groq SDK (LLaMA 3) |
| Video | Stream.io Node SDK |
| File Storage | Cloudinary |
| Email | Resend |
| Auth | JWT — access token (15m) + refresh token (7d) |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
| Validation | Zod |

---

## Project Structure

```
backend/
└── src/
    ├── app.js                         # Entry point — Express + Socket.io server + BullMQ startup
    │
    ├── config/
    │   ├── database.js                # MongoDB connection (Mongoose)
    │   └── redis.js                   # ioredis client (used by BullMQ)
    │
    ├── models/
    │   ├── User.js                    # User schema — skills, coins, rank, stats, social
    │   ├── Session.js                 # Session schema — status lifecycle, Stream.io IDs, coins
    │   ├── Message.js                 # DM message schema — request gating, file attachments
    │   ├── Post.js                    # Feed post schema
    │   ├── Comment.js                 # Post comment schema
    │   ├── Follow.js                  # Follow relationship (follower ↔ following)
    │   ├── Rating.js                  # Per-session ratings (multi-axis scores)
    │   ├── CoinLedger.js              # Immutable coin transfer log
    │   ├── Skill.js                   # Skill catalogue entry
    │   └── SkillRequest.js            # Public skill request post
    │
    ├── controllers/
    │   ├── authController.js          # register, login, refresh, logout, /me
    │   ├── userController.js          # profile, matches, follow/unfollow
    │   ├── sessionController.js       # book, confirm, cancel, start, end, rate, stream-token
    │   ├── messageController.js       # conversations, thread, send, accept, unsend
    │   ├── socialController.js        # feed, posts, likes, comments
    │   ├── aiController.js            # AI matches, session prep, session summary
    │   └── uploadController.js        # Cloudinary upload
    │
    ├── routes/
    │   ├── auth.js                    # /api/auth/*
    │   ├── users.js                   # /api/users/*
    │   ├── sessions.js                # /api/sessions/*
    │   ├── messages.js                # /api/messages/*
    │   ├── social.js                  # /api/social/*
    │   ├── ai.js                      # /api/ai/*
    │   ├── leaderboard.js             # /api/leaderboard
    │   └── upload.js                  # /api/upload
    │
    ├── services/
    │   ├── aiService.js               # Groq LLM calls — match scoring, prep, summary
    │   ├── coinService.js             # Atomic coin transfer + CoinLedger write
    │   ├── emailService.js            # Resend email functions (booking, confirm, rating, etc.)
    │   ├── notificationService.js     # Socket.io push helper — sendSocketNotification()
    │   ├── socketService.js           # Socket.io room join/leave management
    │   └── streamService.js           # Stream.io call + channel token generation
    │
    ├── jobs/
    │   ├── reminderJob.js             # BullMQ worker — reminder email 24h before session
    │   └── postSessionJob.js          # BullMQ worker — rating prompt after session ends
    │
    ├── middleware/
    │   ├── auth.js                    # JWT verification — attaches req.user
    │   ├── validate.js                # Zod schema validation middleware
    │   └── errorHandler.js            # Global error handler (ApiError + unexpected errors)
    │
    ├── utils/
    │   ├── jwt.js                     # signAccessToken, signRefreshToken, verifyToken
    │   ├── ApiError.js                # Custom error class with statusCode + message
    │   └── paginate.js                # Cursor/offset pagination helper
    │
    └── seed.js                        # Database seed script
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local, Upstash, or Railway addon)

### Install & run

```bash
npm install
npm run dev       # nodemon — auto-restarts on file changes
```

Server starts on `http://localhost:5000` by default.

### Seed the database

```bash
npm run seed
```

Creates sample users with skills, sessions, and posts for local development.

---

## Environment Variables

Create a `.env` file in this directory:

```env
# ── Server ─────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000       # Frontend origin for CORS
FRONTEND_URL=http://localhost:3000     # Used in email links

# ── MongoDB ────────────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/knorvex

# ── Redis ──────────────────────────────────────────────────
# ioredis-compatible URL (used by BullMQ and ioredis directly)
REDIS_URL=redis://localhost:6379
# Upstash example:
# REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379

# ── JWT ────────────────────────────────────────────────────
JWT_ACCESS_SECRET=your_long_random_access_secret_here
JWT_REFRESH_SECRET=your_long_random_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ── Groq AI ────────────────────────────────────────────────
# Get key at https://console.groq.com
GROQ_API_KEY=gsk_...

# ── Stream.io Video ────────────────────────────────────────
# Get keys at https://getstream.io → Dashboard → App
STREAM_API_KEY=...
STREAM_API_SECRET=...

# ── Cloudinary ─────────────────────────────────────────────
# Get credentials at https://cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ── Resend Email ───────────────────────────────────────────
# Get key at https://resend.com → API Keys
# RESEND_FROM must use a verified domain in production
# For testing, use: onboarding@resend.dev
RESEND_API_KEY=re_...
RESEND_FROM=Knorvex <notifications@yourdomain.com>

# ── Twilio SMS (optional) ──────────────────────────────────
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...

# ── Razorpay (optional — paid sessions) ───────────────────
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
```

---

## API Reference

Base URL: `http://localhost:5000/api`

Protected routes require the header:
```
Authorization: Bearer <accessToken>
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/register` | | Create account; 100 SkillCoins credited |
| POST | `/login` | | Returns `accessToken` + `refreshToken` |
| POST | `/refresh` | | Exchange refresh token for a new access token |
| POST | `/logout` | ✓ | Invalidate refresh token |
| GET | `/me` | ✓ | Current authenticated user |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/:username` | ✓ | Public profile by username |
| PUT | `/profile` | ✓ | Update bio, avatar, location, timezone, languages |
| GET | `/matches` | ✓ | AI-generated peer matches |
| POST | `/:id/follow` | ✓ | Follow a user |
| DELETE | `/:id/follow` | ✓ | Unfollow a user |
| GET | `/:id/followers` | ✓ | Followers list |
| GET | `/:id/following` | ✓ | Following list |

### Sessions — `/api/sessions`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/` | ✓ | All sessions for the current user |
| POST | `/` | ✓ | Book a session (deducts coins from learner) |
| GET | `/:id` | ✓ | Session detail |
| PUT | `/:id/confirm` | ✓ | Host confirms a pending session |
| POST | `/:id/cancel` | ✓ | Cancel; refunds coins to learner |
| POST | `/:id/start` | ✓ | Mark session active; creates Stream.io call |
| POST | `/:id/end` | ✓ | End session; transfers coins to host |
| POST | `/:id/rate` | ✓ | Submit post-session rating |
| GET | `/:id/stream-token` | ✓ | Get Stream.io video call token |

### Messages — `/api/messages`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/conversations` | ✓ | All conversations (most recent message per peer) |
| GET | `/requests` | ✓ | Pending message requests |
| GET | `/conversations/:userId` | ✓ | Full message thread with a specific user |
| POST | `/` | ✓ | Send message (first message creates a request) |
| PUT | `/:conversationId/accept` | ✓ | Accept a message request |
| DELETE | `/:messageId` | ✓ | Unsend a message (soft-delete) |

### Social — `/api/social`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/feed` | ✓ | Paginated post feed |
| POST | `/posts` | ✓ | Create a post |
| DELETE | `/posts/:id` | ✓ | Delete own post |
| POST | `/posts/:id/like` | ✓ | Like / unlike toggle |
| GET | `/posts/:id/comments` | ✓ | Comment list |
| POST | `/posts/:id/comments` | ✓ | Add a comment |
| DELETE | `/comments/:id` | ✓ | Delete own comment |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/matches` | ✓ | LLM-ranked peer matches for current user |
| GET | `/prep/:sessionId` | ✓ | Pre-session AI prep guide |
| GET | `/summary/:sessionId` | ✓ | Post-session AI-generated notes |

### Leaderboard — `/api/leaderboard`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/` | ✓ | Top 50 users by `rankScore` |

### Upload — `/api/upload`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/` | ✓ | Upload to Cloudinary; returns `{ url, isImage, originalName }` |

### Health check

```
GET /health
```

Returns `{ status: "ok", timestamp, env }`. No auth required. Use this for Railway/Render uptime checks.

---

## Socket.io

Users connect and emit `join` to subscribe to their personal notification room.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ userId }` | Subscribe to personal room |

### Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `session:booked` | `{ sessionId, learnerName }` | Host — someone booked their slot |
| `session:confirmed` | `{ sessionId, skillTag }` | Learner — host approved |
| `session:cancelled` | `{ sessionId }` | Other party cancelled |
| `session:rate_required` | `{ sessionId }` | Session ended — rating needed |
| `session:completed` | `{ sessionId }` | Both parties have rated |
| `message:new` | `{ message }` | New DM received |
| `message:unsent` | `{ messageId }` | Sender retracted a message |

---

## Background Jobs (BullMQ)

Both workers start automatically on server boot. If Redis is unavailable, they log a warning and the server continues running (jobs simply won't process).

| Worker | Queue | Trigger | Action |
|--------|-------|---------|--------|
| `reminderJob` | `session-reminders` | Session confirmed | Sends reminder email 24h before scheduled time |
| `postSessionJob` | `post-session` | Session ended | Sends rating request email to both participants |

---

## Email Notifications (Resend)

All transactional emails are sent via the Resend SDK from `services/emailService.js`. Emails are fire-and-forget — failures are logged as warnings and never crash the request.

| Function | Sent when |
|----------|-----------|
| `sendSessionBookedNotification` | Learner books a session |
| `sendSessionConfirmedNotification` | Host confirms a session |
| `sendSessionRatingNotification` | Session ends (to both users) |
| `sendFollowNotification` | Someone follows a user |
| `sendCommentNotification` | Someone comments on a post |
| `sendMessageNotification` | New DM received |

To send from a custom domain in production, add and verify the domain in your Resend dashboard and update `RESEND_FROM`.

---

## SkillCoin Economy

| Event | Change |
|-------|--------|
| Account created | **+100** |
| Host a session | **+50** |
| Book a session | **−50** |
| Session cancelled | Learner refunded **+50** |

Every transfer creates an entry in `CoinLedger` with `type`, `amount`, `fromUser`, `toUser`, and `sessionId`. The `coinService` writes the ledger entry and updates both user balances atomically.

---

## Rank System

`rankScore` only ever increases (it tracks total coins *earned*, not net balance). Rank is recalculated after every completed session.

| Rank | `rankScore` |
|------|------------|
| Beginner | 0 |
| Explorer | 200 |
| Mentor | 750 |
| Expert | 2,000 |
| Legend | 5,000 |

Reaching **Mentor** sets `isProUser: true`.

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| All `/api/*` routes | 200 requests / 15 min |
| `/api/auth/*` routes | 20 requests / 15 min |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start` | Start for production |
| `npm run seed` | Seed database with sample data |
