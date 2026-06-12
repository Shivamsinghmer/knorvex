import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getUsers, getUserById, updateProfile, deleteMe,
  followUser, unfollowUser, getFollowers, getFollowing,
  getMySkills, addSkill, deleteSkill, blockUser, unblockUser,
  updateProfileSchema, addSkillSchema,
} from '../controllers/userController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getUsers);
router.get('/me/skills', auth, getMySkills);
router.get('/:userId', optionalAuth, getUserById);
router.put('/me', auth, validate(updateProfileSchema), updateProfile);
router.delete('/me', auth, deleteMe);
router.post('/:userId/follow', auth, followUser);
router.delete('/:userId/follow', auth, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.post('/me/skills', auth, validate(addSkillSchema), addSkill);
router.delete('/me/skills/:skillId', auth, deleteSkill);
router.post('/:userId/block', auth, blockUser);
router.delete('/:userId/block', auth, unblockUser);

export default router;
