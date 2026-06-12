import mongoose from 'mongoose';

const CATEGORIES = [
  'Programming', 'Design', 'Music', 'Languages', 'Mathematics',
  'Science', 'Business', 'Writing', 'Photography', 'Cooking',
  'Fitness', 'Art', 'Finance', 'Marketing', 'Other',
];

const skillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: CATEGORIES, required: true },
    direction: { type: String, enum: ['teach', 'learn'], required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], required: true },
    description: { type: String, maxlength: 500, default: '' },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
skillSchema.index({ userId: 1, direction: 1 });
skillSchema.index({ category: 1, direction: 1 });

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
export { CATEGORIES };
