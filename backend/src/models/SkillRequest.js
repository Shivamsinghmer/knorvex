import mongoose from 'mongoose';

const skillRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillName: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },
    urgency: { type: String, enum: ['casual', 'soon', 'urgent'], default: 'casual' },
    isOpen: { type: Boolean, default: true },
    coinOffer: { type: Number, default: 50 },
    responses: [
      {
        responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

skillRequestSchema.index({ isOpen: 1, createdAt: -1 });
skillRequestSchema.index({ skillName: 'text', description: 'text' });

const SkillRequest = mongoose.model('SkillRequest', skillRequestSchema);
export default SkillRequest;
