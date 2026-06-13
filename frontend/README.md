# Knorvex — Frontend

Next.js 16 frontend for the Knorvex peer-to-peer skill exchange platform. Built with the App Router, React 19, Tailwind CSS v4, Framer Motion, and Zustand.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion 12 |
| State Management | Zustand 5 |
| HTTP Client | Axios |
| Video | Stream.io Video React SDK |
| Real-time | Socket.io Client 4 |
| Icons | Lucide React |

---

## Project Structure

```
frontend/
├── app/
│   ├── page.js                        # Landing page (server component, no 'use client')
│   ├── layout.js                      # Root layout — wraps all pages with Navbar
│   ├── globals.css                    # Tailwind base + custom design tokens
│   ├── (auth)/
│   │   ├── login/page.jsx             # Login form
│   │   └── register/page.jsx          # Registration + skill setup
│   └── (main)/                        # Authenticated pages
│       ├── discover/
│       │   ├── page.jsx               # AI-powered peer match grid
│       │   └── loading.jsx            # Skeleton shown during route transition
│       ├── sessions/
│       │   ├── page.jsx               # Session dashboard (upcoming / pending / past)
│       │   ├── loading.jsx
│       │   ├── book/page.jsx          # Book a session with a specific user
│       │   └── [id]/page.jsx          # Live video room (Stream.io)
│       ├── messages/
│       │   ├── page.jsx               # DM inbox
│       │   └── loading.jsx
│       ├── feed/
│       │   ├── page.jsx               # Social post feed
│       │   └── loading.jsx
│       ├── leaderboard/
│       │   ├── page.jsx               # Top users by rankScore
│       │   └── loading.jsx
│       ├── profile/[username]/
│       │   ├── page.jsx               # Public user profile
│       │   └── loading.jsx
│       └── requests/page.jsx          # Skill request board
│
├── components/
│   ├── landing/                       # Landing page sections (each is its own file)
│   │   ├── HeroSection.jsx            # Hero + stats row (client — auth-aware CTA)
│   │   ├── FeaturesSection.jsx        # "What you can do" accordion
│   │   ├── TestimonialsSection.jsx    # 3-column testimonials
│   │   ├── MetricsSection.jsx         # Metrics cards + feature tiles
│   │   ├── CategorySection.jsx        # Category grid + tag pills
│   │   ├── FAQSection.jsx             # FAQ accordion (useState per item)
│   │   ├── CTASection.jsx             # Bottom CTA (hidden when logged in)
│   │   ├── LandingFooter.jsx          # Footer — server component, zero JS hydration
│   │   └── HeroBackground.jsx         # Animated canvas/video background
│   ├── sessions/
│   │   ├── SessionCard.jsx            # Single session card with confirm/cancel/rate actions
│   │   ├── SummaryModal.jsx           # AI session notes overlay
│   │   ├── RatingModal.jsx            # Post-session star rating form
│   │   ├── VideoRoom.jsx              # Stream.io video call UI
│   │   ├── SessionChat.jsx            # In-session chat sidebar
│   │   └── AIPrepCard.jsx             # Pre-session AI prep guide
│   ├── messages/
│   │   ├── ConversationSidebar.jsx    # Left panel — conversation list + search + requests
│   │   └── MessageThread.jsx          # Right panel — message bubbles + input + file attach
│   ├── social/
│   │   ├── PostCard.jsx               # Feed post (React.memo — skips re-render on list updates)
│   │   └── CreatePost.jsx             # New post composer
│   ├── discover/
│   │   └── MatchCard.jsx              # AI match card (React.memo)
│   └── shared/
│       ├── Navbar.jsx                 # Top navigation bar
│       ├── Avatar.jsx                 # User avatar with fallback
│       ├── RankBadge.jsx              # Rank chip (Beginner / Explorer / Mentor / Expert / Legend)
│       ├── SkillTag.jsx               # Skill pill (teach = green, learn = blue)
│       └── CoinDisplay.jsx            # SkillCoin balance display
│
├── lib/
│   ├── api.js                         # Axios instance — base URL + auth header injection
│   ├── motion.js                      # Shared Framer Motion variants (fadeUp, stagger, etc.)
│   ├── uploadImage.js                 # Cloudinary file upload helper
│   └── utils.js                       # timeAgo, cn(), and other helpers
│
└── store/
    ├── authStore.js                   # Zustand — current user, login, logout, register
    ├── sessionStore.js                # Zustand — sessions list, fetchSessions, updateSession
    └── coinStore.js                   # Zustand — SkillCoin balance
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Backend running (see `../backend/README.md`)

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

---

## Environment Variables

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Backend Socket.io URL (no `/api` suffix) |
| `NEXT_PUBLIC_STREAM_API_KEY` | Stream.io public key (same value as backend `STREAM_API_KEY`) |

---

## Key Patterns

### Server vs Client components

The landing page (`app/page.js`) is a **server component** — no `'use client'`, exports `metadata` for SEO, and composes client section components. `LandingFooter` is also a server component. All other pages are client components because they use Zustand stores, socket connections, or browser APIs.

Push `'use client'` as far down the tree as possible — the boundary should be at the leaf that actually needs interactivity, not at the page level.

### Framer Motion variants

All animation variants are defined once in `lib/motion.js` and imported everywhere:

```js
import { fadeUp, stagger, cardHover, tap } from '@/lib/motion';
```

Available exports: `fadeUp`, `fadeIn`, `fadeLeft`, `fadeRight`, `scaleIn`, `stagger`, `staggerFast`, `staggerSlow`, `cardHover`, `tap`, `pageVariants`.

### Real-time (Socket.io)

Pages that need real-time updates create a socket in a `useEffect`, emit `join` with the user ID to subscribe to a personal room, and listen for server-pushed events. Cleanup always disconnects the socket in the return function.

```js
useEffect(() => {
  if (!user) return;
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { transports: ['websocket'] });
  socket.on('connect', () => socket.emit('join', { userId: user.id }));
  socket.on('session:booked', () => { fetchSessions(); setActiveTab('pending'); });
  return () => { socket.off('session:booked'); socket.disconnect(); };
}, [user?.id]);
```

### Loading skeletons

Every route under `(main)/` has a `loading.jsx` file. Next.js App Router automatically shows it as a Suspense fallback during navigation, giving instant visual feedback before data loads.

### React.memo

`MatchCard` and `PostCard` are wrapped in `React.memo`. Because they appear in long lists and the parent frequently re-renders (new post added, socket message received), memo prevents all existing cards from re-rendering when only unrelated state changes.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
