import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/database.js';
import redisClient from './config/redis.js';
import { setSocketIO } from './services/notificationService.js';
import initSocketService from './services/socketService.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import sessionRoutes from './routes/sessions.js';
import aiRoutes from './routes/ai.js';
import socialRoutes from './routes/social.js';
import messageRoutes from './routes/messages.js';
import leaderboardRoutes from './routes/leaderboard.js';
import uploadRoutes from './routes/upload.js';

import errorHandler from './middleware/errorHandler.js';

// BullMQ workers
import { startReminderWorker } from './jobs/reminderJob.js';
import { startPostSessionWorker } from './jobs/postSessionJob.js';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setSocketIO(io);
initSocketService(io);

// ─── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Strict rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts' },
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/upload', uploadRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// ─── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ─── Startup ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  try {
    await connectDB();
    await redisClient.connect().catch(() => {}); // lazy connect

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Knorvex API running on http://localhost:${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Start BullMQ workers
    try {
      startReminderWorker();
      startPostSessionWorker();
    } catch (workerErr) {
      console.warn('⚠️  BullMQ workers could not start (Redis may not be available):', workerErr.message);
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();

export { app, io };
