import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const RANKS = ['Beginner', 'Explorer', 'Mentor', 'Expert', 'Legend'];
const RANK_THRESHOLDS = { Beginner: 0, Explorer: 200, Mentor: 750, Expert: 2000, Legend: 5000 };

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    aiSummary: { type: String, maxlength: 800, default: '' },

    // SkillCoins & Rank
    skillCoinBalance: { type: Number, default: 100, min: 0 },
    rankScore: { type: Number, default: 0 },
    rank: { type: String, enum: RANKS, default: 'Beginner' },

    // Session stats
    totalSessionsTaught: { type: Number, default: 0 },
    totalSessionsLearned: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Pro tier (unlocked at Mentor)
    isProUser: { type: Boolean, default: false },
    proUnlockedAt: { type: Date },

    // Stream.io
    streamUserId: { type: String },

    // Privacy
    isPublic: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },

    // Social
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    // Profile details
    location: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    languages: { type: [String], default: ['English'] },

    // Block list
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ rankScore: -1 });
userSchema.index({ name: 'text', bio: 'text' });

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Compare plaintext password against stored hash
 */
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

/**
 * Recalculate and persist rank score after earning coins
 * Formula: rankScore += floor(coinsEarned * 0.7 + avgRating * 30)
 */
userSchema.methods.updateRankScore = async function (coinsEarned) {
  const delta = Math.floor(coinsEarned * 0.7 + this.avgRating * 30);
  this.rankScore += delta;

  // Determine new rank
  if (this.rankScore >= RANK_THRESHOLDS.Legend) this.rank = 'Legend';
  else if (this.rankScore >= RANK_THRESHOLDS.Expert) this.rank = 'Expert';
  else if (this.rankScore >= RANK_THRESHOLDS.Mentor) this.rank = 'Mentor';
  else if (this.rankScore >= RANK_THRESHOLDS.Explorer) this.rank = 'Explorer';
  else this.rank = 'Beginner';

  // Auto-unlock pro at Mentor
  if (['Mentor', 'Expert', 'Legend'].includes(this.rank) && !this.isProUser) {
    this.isProUser = true;
    this.proUnlockedAt = new Date();
  }

  await this.save();
  return delta;
};

/**
 * Update rolling average rating after a new rating is submitted
 */
userSchema.methods.addRating = async function (newRating) {
  const totalScore = this.avgRating * this.ratingCount + newRating;
  this.ratingCount += 1;
  this.avgRating = parseFloat((totalScore / this.ratingCount).toFixed(2));
  await this.save();
};

/**
 * Return user data safe for API responses (strip sensitive fields)
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.blockedUsers;
  delete obj.__v;
  return obj;
};

// ─── Pre-save hook ────────────────────────────────────────────────────────────
userSchema.pre('save', function (next) {
  this.lastSeen = new Date();
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
