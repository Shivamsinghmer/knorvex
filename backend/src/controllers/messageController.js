import Message from '../models/Message.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSocketNotification } from '../services/notificationService.js';
import { sendMessageNotification } from '../services/emailService.js';
import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().max(2000).optional().default(''),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  mediaType: z.enum(['image', 'file', '']).optional().default(''),
  fileName: z.string().max(255).optional().default(''),
}).refine((d) => (d.content && d.content.trim().length > 0) || (d.mediaUrl && d.mediaUrl.length > 0), {
  message: 'Message must have content or a file attachment.',
});

const makeConversationId = (id1, id2) => [id1, id2].sort().join('_');

// GET /api/messages/conversations — list all DM conversations
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Get latest message per conversation
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          latestMessage: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latestMessage' } },
      { $sort: { createdAt: -1 } },
    ]);

    // Populate other user
    const populated = await Promise.all(
      messages.map(async (msg) => {
        const otherId = msg.senderId.toString() === userId ? msg.receiverId : msg.senderId;
        const other = await User.findById(otherId).select('name avatar rank isActive lastSeen').lean();
        return { ...msg, otherUser: other };
      })
    );

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/conversations/:userId — messages with a specific user
export const getConversation = async (req, res, next) => {
  try {
    const conversationId = makeConversationId(req.user._id.toString(), req.params.userId);
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, status: { $ne: 'read' } },
      { status: 'read' }
    );

    res.json({
      success: true,
      data: messages.reverse(),
      total,
      page: parseInt(page, 10),
      hasMore: parseInt(page, 10) * parseInt(limit, 10) < total,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages — send a message (first DM = request)
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content = '', mediaUrl = '', mediaType = '', fileName = '' } = req.body;
    const senderId = req.user._id.toString();

    if (receiverId === senderId) throw ApiError.badRequest('Cannot message yourself');

    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) throw ApiError.notFound('User not found');

    const conversationId = makeConversationId(senderId, receiverId);

    // Check if this is the first message (determine if it's a request)
    const existingCount = await Message.countDocuments({ conversationId });
    const isRequest = existingCount === 0;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      content,
      mediaUrl,
      mediaType,
      fileName,
      conversationId,
      isRequest,
      status: isRequest ? 'pending' : 'accepted',
    });

    // Real-time delivery
    sendSocketNotification(receiverId, 'message:new', {
      conversationId,
      message: {
        ...message.toObject(),
        senderName: req.user.name,
        senderAvatar: req.user.avatar,
      },
    });

    // Email notification — only on the very first message (request) to avoid reply spam
    if (isRequest && receiver.email) {
      sendMessageNotification(
        { name: receiver.name, email: receiver.email },
        { name: req.user.name },
        content || '(attachment)',
        true,
      );
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

// PUT /api/messages/:conversationId/accept
export const acceptRequest = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversationId, receiverId: req.user._id, isRequest: true },
      { status: 'accepted' }
    );
    res.json({ success: true, message: 'Message request accepted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/messages/:messageId — unsend a message (sender only)
export const unsendMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) throw ApiError.notFound('Message not found');
    if (message.senderId.toString() !== req.user._id.toString())
      throw ApiError.forbidden('You can only unsend your own messages');

    message.unsent = true;
    message.content = '';
    message.mediaUrl = '';
    message.mediaType = '';
    message.fileName = '';
    await message.save();

    // Notify the other user in real time
    const otherId = message.receiverId.toString();
    sendSocketNotification(otherId, 'message:unsent', { messageId: message._id });

    res.json({ success: true, data: { messageId: message._id } });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/requests — pending message requests
export const getRequests = async (req, res, next) => {
  try {
    const requests = await Message.find({
      receiverId: req.user._id,
      isRequest: true,
      status: 'pending',
    })
      .populate('senderId', 'name avatar rank')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};
