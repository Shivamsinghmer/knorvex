import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getMatches, regenerateProfileSummary, getSessionPrep, getSessionSummary, getRankedRequestBoard,
  createSkillRequest, createSkillRequestSchema
} from '../controllers/aiController.js';

const router = express.Router();

router.use(auth); // All AI routes require auth

router.get('/matches', getMatches);
router.post('/profile-summary', regenerateProfileSummary);
router.get('/prep/:sessionId', getSessionPrep);
router.get('/summary/:sessionId', getSessionSummary);
router.get('/request-board', getRankedRequestBoard);
router.post('/request-board', validate(createSkillRequestSchema), createSkillRequest);

export default router;
