# Knorvex — Peer-to-Peer Skill Barter Platform

Knorvex is a peer-to-peer skill exchange platform designed for the **DevQBX Arena** hackathon. It operates as a barter-style learning community where users teach their expertise, learn new disciplines from peers, transact using **SkillCoins**, build ranking scores, and host video calls integrated with AI study aids.

---

## 🚀 Quick Start & Setup

Ensure you have [Node.js (>=18)](https://nodejs.org) and [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 1. Database & Cache Configuration

#### Backend setup:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The dependencies are configured in [backend/package.json](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/backend/package.json). Install them:
   ```bash
   npm install
   ```
3. A development environment configuration is located in [backend/.env](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/backend/.env) (copied from [backend/.env.example](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/backend/.env.example)). Adjust parameters like `MONGO_URI` or `REDIS_URL` if necessary.

#### Frontend setup:
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. The dependencies are configured in [frontend/package.json](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/frontend/package.json). Install them:
   ```bash
   npm install
   ```

---

### 2. Seeding the Demo Data

To run the hackathon demo, seed the database with pre-configured users, skills, past sessions, reviews, and social feed posts:

1. Inside the `backend/` directory, run the seed script:
   ```bash
   npm run seed
   ```
   *This executes the script [backend/src/seed.js](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/backend/src/seed.js) which seeds Alice, Bob, and Carol.*

---

### 3. Running the Development Servers

Open two terminal windows to run both servers concurrently:

#### Start Backend server:
```bash
cd backend
npm run dev
```
*The Express application boots from [backend/src/app.js](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/backend/src/app.js) and starts listening on `http://localhost:5000`.*

#### Start Frontend server:
```bash
cd frontend
npm run dev
```
*The Next.js application launches from [frontend/app/page.js](file:///c:/Users/mersh/OneDrive/Desktop/knorvex/frontend/app/page.js) and is available at `http://localhost:3000`.*

---

## ⚡ Demo Accounts

Use these credentials to sign in and test the platform features:

| User Email | Password | Rank Tier | Specialty |
|---|---|---|---|
| `alice@knorvex.demo` | `Demo1234!` | Explorer | React.js / Node.js developer |
| `bob@knorvex.demo` | `Demo1234!` | Mentor (Pro) | Music Production / Ableton / Guitar |
| `carol@knorvex.demo` | `Demo1234!` | Explorer | UI/UX Designer / Figma |

---

## 🛠️ Key Architectural Features

1. **AI Matchmaking System** - Matches users' complementary interests. Profiles contain an automatic, OpenAI-generated biography summary (`aiSummary` fields). Recommended peers list compatibility rates (e.g. `95% Match`) and reasons.
2. **Interactive Skill Board** - Post public learning requests which are AI-sorted for instructors based on their teach lists, featuring quick "Teach Peer" booking commands.
3. **High-Fidelity Communication** - Stream.io video channels with side-by-side text chat logs connected in real-time.
4. **AI Smart Preparation** - Generates on-demand preparation guidelines for study sessions based on participants' skills, showing points of focus.
5. **Double-Sided Ledger Economy** - Transfers SkillCoins from the learner's balance to the instructor's wallet once both submit reviews. Integrates rolling ratings and points calculation to dynamically rank up.
6. **Threaded Social Feed** - Discuss, comment recursively, category-filter posts, and attach media URL previews.
