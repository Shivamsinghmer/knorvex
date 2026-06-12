import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '', maxlength: 2000 },
    mediaUrl: { type: String, default: '' },
    // First DM from any user is always a request
    isRequest: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'accepted', 'read'], default: 'pending' },
    // Sorted concat of both user IDs: [userId1, userId2].sort().join('_')
    conversationId: { type: String, required: true, index: true },
    mediaType: { type: String, enum: ['image', 'file', ''], default: '' },
    fileName: { type: String, default: '' },
    unsent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
