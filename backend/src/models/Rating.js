import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rateeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 4-axis scoring (1–5 each)
    clarity: { type: Number, required: true, min: 1, max: 5 },
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    engagement: { type: Number, required: true, min: 1, max: 5 },
    overall: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Ensure one rating per rater per session
ratingSchema.index({ sessionId: 1, raterId: 1 }, { unique: true });
ratingSchema.index({ rateeId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
