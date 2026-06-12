import User from '../models/User.js';

// Track connected users: userId → Set of socket IDs
const onlineUsers = new Map();

/**
 * Initialize Socket.io handlers
 * @param {import('socket.io').Server} io
 */
const initSocketService = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Join user room for targeted notifications ─────────────────────────
    socket.on('join', async ({ userId }) => {
      if (!userId) return;

      socket.join(`user:${userId}`);

      // Track online status
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Update lastSeen
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch { /* ignore */ }

      // Notify friends of online status
      socket.broadcast.emit('user:online', { userId });
      console.log(`👤 User ${userId} joined (${onlineUsers.get(userId).size} connections)`);
    });

    // ─── Join session room ─────────────────────────────────────────────────
    socket.on('session:join', ({ sessionId }) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        socket.to(`session:${sessionId}`).emit('session:participant_joined', {
          socketId: socket.id,
        });
      }
    });

    // ─── Typing indicators ─────────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:start', { socketId: socket.id });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:stop', { socketId: socket.id });
    });

    // ─── Join DM conversation room ─────────────────────────────────────────
    socket.on('conversation:join', ({ conversationId }) => {
      if (conversationId) socket.join(`conv:${conversationId}`);
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      // Remove from online tracking
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit('user:offline', { userId });
          }
          break;
        }
      }
    });
  });
};

/**
 * Check if a user is currently online
 * @param {string} userId
 * @returns {boolean}
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

export default initSocketService;
