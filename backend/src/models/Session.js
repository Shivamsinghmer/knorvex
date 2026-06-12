import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['oneOnOne', 'group'], default: 'oneOnOne' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'pending_rating'],
      default: 'pending',
    },
    skillTag: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },

    // Participants (for group sessions)
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['host', 'learner'] },
        joinedAt: { type: Date },
      },
    ],

    // Stream.io integration
    streamChannelId: { type: String },
    streamCallId: { type: String },

    // SkillCoin economy
    coinsReward: { type: Number, default: 50 },
    isPaidSession: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 }, // In paise (₹1 = 100 paise)
    razorpayOrderId: { type: String },

    // Recording
    isRecorded: { type: Boolean, default: false },
    recordingUrl: { type: String },

    // AI features
    aiPrepSent: { type: Boolean, default: false },
    aiSummary: { type: String },

    // Ratings tracking (to know when both submitted)
    hostRated: { type: Boolean, default: false },
    learnerRated: { type: Boolean, default: false },

    // Cancellation
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

sessionSchema.index({ hostId: 1, status: 1 });
sessionSchema.index({ learnerId: 1, status: 1 });
sessionSchema.index({ scheduledAt: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
