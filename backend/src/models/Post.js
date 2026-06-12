import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    skillTag: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isSkillRequest: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // Soft delete
    // Users who liked this post
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ skillTag: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
