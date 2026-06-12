import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getFeed, createPost, getPost, deletePost, likePost, unlikePost,
  getComments, createComment, deleteComment,
  createPostSchema, createCommentSchema,
} from '../controllers/socialController.js';

const router = express.Router();

router.use(auth);

router.get('/feed', getFeed);
router.post('/posts', validate(createPostSchema), createPost);
router.get('/posts/:postId', getPost);
router.delete('/posts/:postId', deletePost);
router.post('/posts/:postId/like', likePost);
router.delete('/posts/:postId/like', unlikePost);
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', validate(createCommentSchema), createComment);
router.delete('/comments/:commentId', deleteComment);

export default router;
