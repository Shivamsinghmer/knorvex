import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';
import { sendCommentNotification } from '../services/emailService.js';
import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1).max(1000),
  skillTag: z.string().max(100).optional().default(''),
  mediaUrl: z.string().url().optional().or(z.literal('')).default(''),
  isSkillRequest: z.boolean().optional().default(false),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

// GET /api/social/feed — paginated posts (following + skill-tagged)
export const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, skillTag } = req.query;
    const userId = req.user._id;

    // Get IDs of users I follow
    const follows = await Follow.find({ followerId: userId }).select('followingId').lean();
    const followingIds = follows.map((f) => f.followingId);

    const filter = {
      isActive: true,
      $or: [{ authorId: { $in: [...followingIds, userId] } }],
    };
    if (skillTag) {
      filter.$or.push({ skillTag: new RegExp(skillTag, 'i') });
    }

    const query = Post.find(filter)
      .populate('authorId', 'name avatar rank')
      .sort({ createdAt: -1 });

    const result = await paginate(query, Post, filter, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST /api/social/posts
export const createPost = async (req, res, next) => {
  try {
    const post = await Post.create({ ...req.body, authorId: req.user._id });
    await post.populate('authorId', 'name avatar rank');
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// GET /api/social/posts/:postId
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('authorId', 'name avatar rank');
    if (!post || !post.isActive) throw ApiError.notFound('Post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/social/posts/:postId
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.isActive) throw ApiError.notFound('Post not found');
    if (post.authorId.toString() !== req.user._id.toString()) throw ApiError.forbidden('Not your post');
    post.isActive = false;
    await post.save();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/social/posts/:postId/like
export const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.isActive) throw ApiError.notFound('Post not found');

    const alreadyLiked = post.likes.includes(req.user._id);
    if (!alreadyLiked) {
      post.likes.push(req.user._id);
      post.likeCount += 1;
      await post.save();
    }
    res.json({ success: true, data: { likeCount: post.likeCount, liked: true } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/social/posts/:postId/like
export const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.isActive) throw ApiError.notFound('Post not found');

    const idx = post.likes.indexOf(req.user._id.toString());
    if (idx > -1) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
      post.likeCount = Math.max(0, post.likeCount - 1);
      await post.save();
    }
    res.json({ success: true, data: { likeCount: post.likeCount, liked: false } });
  } catch (err) {
    next(err);
  }
};

// GET /api/social/posts/:postId/comments
export const getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { postId: req.params.postId, parentId: null, isActive: true };
    const query = Comment.find(filter)
      .populate('authorId', 'name avatar rank')
      .sort({ createdAt: 1 });

    const result = await paginate(query, Comment, filter, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// POST /api/social/posts/:postId/comments
export const createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || !post.isActive) throw ApiError.notFound('Post not found');

    const comment = await Comment.create({
      ...req.body,
      postId: req.params.postId,
      authorId: req.user._id,
    });

    post.commentCount += 1;
    await post.save();

    // Email post author if someone else commented
    const authorId = post.authorId?._id?.toString() || post.authorId?.toString();
    if (authorId && authorId !== req.user._id.toString()) {
      const author = await User.findById(authorId).select('name email').lean();
      if (author?.email) {
        sendCommentNotification(
          { name: author.name, email: author.email },
          { name: req.user.name },
          post,
          req.body.content,
        );
      }
    }

    await comment.populate('authorId', 'name avatar rank');
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/social/comments/:commentId
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.isActive) throw ApiError.notFound('Comment not found');
    if (comment.authorId.toString() !== req.user._id.toString()) throw ApiError.forbidden('Not your comment');

    comment.isActive = false;
    await comment.save();

    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
