import express from 'express';
import validate from '../middleware/validate.js';
import auth from '../middleware/auth.js';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  registerSchema,
  loginSchema,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

export default router;
