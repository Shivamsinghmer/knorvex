# Knorvex

**India's peer-to-peer skill exchange platform.** Teach what you know, learn what you don't — powered by SkillCoins and AI matching. No money changes hands.

Built for DevQBX Arena.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [SkillCoin Economy](#skillcoin-economy)
- [Rank System](#rank-system)
- [Deployment](#deployment)

---

## Overview

Knorvex is a full-stack skill-barter platform where users list skills they can teach and skills they want to learn. An AI matching engine (powered by Groq LLM) continuously surfaces high-compatibility peer matches. Sessions are booked, conducted over HD video (Stream.io), and paid for entirely in **SkillCoins** — a platform-internal currency. No payment gateway, no commission, no rupees.

New users receive **100 SkillCoins** on signup. Teaching earns coins; learning spends them. Ratings build a public reputation score that unlocks progressive ranks from Beginner to Legend.

---

## Features

### Core
- **AI Peer Matching** — Groq LLM scans the community and surfaces compatible teach/learn pairs
- **Session Booking** — schedule 1:1 video sessions; host confirms or declines
- **HD Video Rooms** — built-in video via Stream.io SDK (no third-party install needed)
- **SkillCoin Economy** — earn coins by teaching, spend to learn; balance shown live
- **Rank Progression** — Beginner → Explorer → Mentor → Expert → Legend based on total coins earned

### Social
- **Follow system** — follow other users; follower/following counts on profile
- **Feed** — post updates, like, comment; real-time comment notifications
- **Direct messages** — request-gated DMs with file/image attachments (Cloudinary), real-time via Socket.io
- **Leaderboard** — top users ranked by rankScore

### AI Features
- **AI Session Prep** — before a session, host gets a Groq-generated prep guide
- **AI Session Summary** — after a session ends, AI generates notes/summary accessible to both participants
- **AI Profile Summary** — auto-generated `aiSummary` field on user profile from their skills

### Notifications
- **Real-time** — Socket.io push for new messages, session events, follows
- **Email** — transactional emails via Resend for session bookings, confirmations, ratings requests, comments, follows, and DMs
- **Background jobs** — BullMQ + Redis for session reminder emails (24h before) and post-session rating prompts

### Quality of Life
- **Animated skeletons** — every route shows a loading skeleton during navigation
- **Page animations** — Framer Motion on all pages (whileInView, stagger, entrance transitions)
- **Real-time session updates** — sessions tab auto-updates when booked/confirmed/cancelled without page reload
- **Rate limiting** — global 200 req/15 min; strict 20 req/15 min on auth endpoints
- **Request-gated messaging** — users must accept a message request before a conversation opens

---

## Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| State | Zustand 5 |
| HTTP | Axios |
| Video | Stream.io Video React SDK |
| Real-time | Socket.io Client |
| Icons | Lucide React |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 (ESM) |
| Framework | Express 4 |
| Database | MongoDB (Mongoose 8) |
| Cache / Queues | Redis (ioredis + BullMQ) |
| Real-time | Socket.io 4 |
| AI | Groq SDK (LLaMA 3) |
| Video | Stream.io Node SDK |
| File Storage | Cloudinary |
| Email | Resend |
| Auth | JWT (access 15m + refresh 7d) |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |
| Validation | Zod |

---

## Project Structure

```
knorvex/
├── frontend/                          # Next.js app
│   ├── app/
│   │   ├── page.js                    # Landing page (server component)
│   │   ├── layout.js                  # Root layout + Navbar
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.jsx
│   │   │   └── register/page.jsx
│   │   └── (main)/
│   │       ├── discover/
│   │       │   ├── page.jsx           # AI match grid
│   │       │   └── loading.jsx
│   │       ├── sessions/
│   │       │   ├── page.jsx           # Session dashboard
│   │       │   ├── loading.jsx
│   │       │   ├── book/page.jsx      # Session booking form
│   │       │   └── [id]/page.jsx      # Live video room
│   │       ├── messages/
│   │       │   ├── page.jsx           # DM inbox
│   │       │   └── loading.jsx
│   │       ├── feed/
│   │       │   ├── page.jsx
│   │       │   └── loading.jsx
│   │       ├── leaderboard/
│   │       │   ├── page.jsx
│   │       │   └── loading.jsx
│   │       ├── profile/[username]/
│   │       │   ├── page.jsx
│   │       │   └── loading.jsx
│   │       └── requests/page.jsx      # Skill requests board
│   ├── components/
│   │   ├── landing/                   # Landing page sections
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── TestimonialsSection.jsx
│   │   │   ├── MetricsSection.jsx
│   │   │   ├── CategorySection.jsx
│   │   │   ├── FAQSection.jsx
│   │   │   ├── CTASection.jsx
│   │   │   ├── LandingFooter.jsx      # Server component (no JS hydration)
│   │   │   └── HeroBackground.jsx
│   │   ├── sessions/
│   │   │   ├── SessionCard.jsx
│   │   │   ├── SummaryModal.jsx
│   │   │   ├── RatingModal.jsx
│   │   │   ├── VideoRoom.jsx
│   │   │   ├── SessionChat.jsx
│   │   │   └── AIPrepCard.jsx
│   │   ├── messages/
│   │   │   ├── ConversationSidebar.jsx
│   │   │   └── MessageThread.jsx
│   │   ├── social/
│   │   │   ├── PostCard.jsx
│   │   │   └── CreatePost.jsx
│   │   ├── discover/
│   │   │   └── MatchCard.jsx
│   │   └── shared/
│   │       ├── Navbar.jsx
│   │       ├── Avatar.jsx
│   │       ├── RankBadge.jsx
│   │       ├── SkillTag.jsx
│   │       └── CoinDisplay.jsx
│   ├── lib/
│   │   ├── api.js                     # Axios instance
│   │   ├── motion.js                  # Shared Framer Motion variants
│   │   ├── uploadImage.js
│   │   └── utils.js
│   └── store/
│       ├── authStore.js               # Zustand — user + auth
│       ├── sessionStore.js            # Zustand — sessions
│       └── coinStore.js               # Zustand — SkillCoin balance
│
└── backend/                           # Express API
    └── src/
        ├── app.js                     # Entry point — Express + Socket.io + BullMQ
        ├── config/
        │   ├── database.js            # MongoDB connection
        │   └── redis.js               # ioredis client
        ├── models/
        │   ├── User.js
        │   ├── Session.js
        │   ├── Message.js
        │   ├── Post.js
        │   ├── Comment.js
        │   ├── Follow.js
        │   ├── Rating.js
        │   ├── CoinLedger.js
        │   ├── Skill.js
        │   └── SkillRequest.js
        ├── controllers/
        │   ├── authController.js
        │   ├── userController.js
        │   ├── sessionController.js
        │   ├── messageController.js
        │   ├── socialController.js
        │   ├── aiController.js
        │   └── uploadController.js
        ├── routes/
        │   ├── auth.js
        │   ├── users.js
        │   ├── sessions.js
        │   ├── messages.js
        │   ├── social.js
        │   ├── ai.js
        │   ├── leaderboard.js
        │   └── upload.js
        ├── services/
        │   ├── aiService.js           # Groq LLM calls
        │   ├── coinService.js         # SkillCoin transfers + ledger
        │   ├── emailService.js        # Resend transactional emails
        │   ├── notificationService.js # Socket.io push helper
        │   ├── socketService.js       # Socket.io room management
        │   └── streamService.js       # Stream.io token generation
        ├── jobs/
        │   ├── reminderJob.js         # BullMQ — email 24h before session
        │   └── postSessionJob.js      # BullMQ — rating prompt after session
        ├── middleware/
        │   ├── auth.js                # JWT verification
        │   ├── validate.js            # Zod schema validation
        │   └── errorHandler.js
        └── utils/
            ├── jwt.js
            ├── ApiError.js
            └── paginate.js
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local, Railway addon, or Upstash)

### 1. Clone & install

```bash
git clone https://github.com/your-username/knorvex.git
cd knorvex

# Install frontend deps
cd frontend && npm install

# Install backend deps
cd ../backend && npm install
```

### 2. Configure environment variables

```bash
# Copy the example files and fill in your values
cp backend/.env.example backend/.env
# For the frontend, create .env.local in the frontend folder
```

See the [Environment Variables](#environment-variables) section for all required keys.

### 3. Seed the database (optional)

```bash
cd backend
npm run seed
```

### 4. Run in development

```bash
# Terminal 1 — backend API + Socket.io (port 5000)
cd backend && npm run dev

# Terminal 2 — Next.js frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/knorvex

# Redis — ioredis-compatible URL (used by BullMQ)
REDIS_URL=redis://localhost:6379
# Upstash example:
# REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379

# JWT
JWT_ACCESS_SECRET=your_very_long_random_access_secret
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Groq AI — https://console.groq.com
GROQ_API_KEY=gsk_...

# Stream.io Video — https://getstream.io
STREAM_API_KEY=...
STREAM_API_SECRET=...

# Cloudinary — https://cloudinary.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Resend Email — https://resend.com
RESEND_API_KEY=re_...
RESEND_FROM=Knorvex <notifications@yourdomain.com>

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...

# Razorpay (optional — for paid sessions)
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_STREAM_API_KEY=          # Same value as backend STREAM_API_KEY
```

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create account; 100 SkillCoins credited automatically |
| POST | `/login` | No | Returns `accessToken` + `refreshToken` |
| POST | `/refresh` | No | Exchange refresh token for a new access token |
| POST | `/logout` | Yes | Invalidate refresh token |
| GET | `/me` | Yes | Current user profile |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:username` | Yes | Public profile by username |
| PUT | `/profile` | Yes | Update bio, avatar, location, timezone, languages |
| GET | `/matches` | Yes | AI-generated peer matches for the current user |
| POST | `/:id/follow` | Yes | Follow a user |
| DELETE | `/:id/follow` | Yes | Unfollow a user |
| GET | `/:id/followers` | Yes | Follower list |
| GET | `/:id/following` | Yes | Following list |

### Sessions — `/api/sessions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | All sessions for the current user |
| POST | `/` | Yes | Book a new session (deducts coins from learner) |
| GET | `/:id` | Yes | Session detail |
| PUT | `/:id/confirm` | Yes | Host confirms a pending session |
| POST | `/:id/cancel` | Yes | Cancel (refunds coins to learner) |
| POST | `/:id/start` | Yes | Mark session active; creates Stream.io call |
| POST | `/:id/end` | Yes | End session; transfers coins to host + triggers rating |
| POST | `/:id/rate` | Yes | Submit rating (1–5 stars + per-axis scores) |
| GET | `/:id/stream-token` | Yes | Get Stream.io video call token |

### Messages — `/api/messages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/conversations` | Yes | List all conversations (most recent message per peer) |
| GET | `/requests` | Yes | Pending message requests |
| GET | `/conversations/:userId` | Yes | Full message thread with a specific user |
| POST | `/` | Yes | Send message (first message creates a request) |
| PUT | `/:conversationId/accept` | Yes | Accept a message request |
| DELETE | `/:messageId` | Yes | Unsend a message (soft-delete) |

### Social — `/api/social`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/feed` | Yes | Paginated post feed |
| POST | `/posts` | Yes | Create a post |
| DELETE | `/posts/:id` | Yes | Delete own post |
| POST | `/posts/:id/like` | Yes | Like / unlike toggle |
| GET | `/posts/:id/comments` | Yes | Comment list |
| POST | `/posts/:id/comments` | Yes | Add a comment |
| DELETE | `/comments/:id` | Yes | Delete own comment |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches` | Yes | LLM-ranked peer matches for current user |
| GET | `/prep/:sessionId` | Yes | Pre-session AI prep guide |
| GET | `/summary/:sessionId` | Yes | Post-session AI-generated notes |

### Leaderboard — `/api/leaderboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | Top 50 users by `rankScore` |

### Upload — `/api/upload`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Yes | Upload file to Cloudinary; returns `{ url, isImage, originalName }` |

---

## Socket Events

Users join a personal room on connect (`join` event). All notifications are delivered to that room.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ userId }` | Subscribe to personal notification room |

### Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `session:booked` | `{ sessionId, learnerName }` | Host receives when someone books their slot |
| `session:confirmed` | `{ sessionId, skillTag }` | Learner receives when host confirms |
| `session:cancelled` | `{ sessionId }` | The other party receives on cancellation |
| `session:rate_required` | `{ sessionId }` | Both users receive when session ends |
| `session:completed` | `{ sessionId }` | Both users receive after both have rated |
| `message:new` | `{ message }` | New DM delivered in real time |
| `message:unsent` | `{ messageId }` | Sender retracted a message |

---

## SkillCoin Economy

| Event | Change |
|-------|--------|
| Account created | **+100** |
| Host a session (teach) | **+50** |
| Book a session (learn) | **−50** |
| Session cancelled | Learner refunded **+50** |

Transfers are recorded in the `CoinLedger` collection with `type`, `amount`, `fromUser`, `toUser`, and `sessionId`. Both user balances and the ledger entry are written together to prevent partial updates.

---

## Rank System

`rankScore` accumulates coins earned by **teaching** (not net balance). It never decreases.

| Rank | `rankScore` Required |
|------|---------------------|
| Beginner | 0 |
| Explorer | 200 |
| Mentor | 750 |
| Expert | 2,000 |
| Legend | 5,000 |

Reaching **Mentor** (750) sets `isProUser: true` on the user document. Rank is recalculated automatically after every completed session.

---

## Deployment

### Recommended setup

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | [Vercel](https://vercel.com) | Zero-config Next.js, free tier |
| Backend | [Railway](https://railway.app) | Persistent Node.js + Redis addon |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) | Free M0 cluster |
| Redis | Railway Redis plugin | Injected as `REDIS_URL` automatically |

### Frontend on Vercel

1. Push code to GitHub
2. Import the `frontend/` folder on [vercel.com](https://vercel.com)
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
   ```
4. Deploy — Vercel auto-deploys on every push to main

### Backend on Railway

1. Create a new project, connect your GitHub repo
2. Add a **Redis** plugin from the Railway dashboard (auto-sets `REDIS_URL`)
3. Add all backend environment variables
4. Set start command to `npm start`
5. Update `CLIENT_URL` and `FRONTEND_URL` to your Vercel domain

> **Why not Vercel for the backend?** Socket.io requires persistent WebSocket connections and BullMQ requires a long-running worker process. Vercel's serverless functions terminate after ~30 seconds and don't support either. Use Railway, Render, or Fly.io for any backend with real-time or queue requirements.

### After deploying — update CORS

Set these in your backend environment:

```env
CLIENT_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

---

## License

MIT © 2026 Knorvex · DevQBX Arena
