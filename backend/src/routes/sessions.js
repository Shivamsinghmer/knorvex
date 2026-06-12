import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  bookSession, listSessions, getUpcoming, getSession, confirmSession,
  startSession, endSession, rateSession, getSessionToken, cancelSession,
  bookSessionSchema, rateSessionSchema,
} from '../controllers/sessionController.js';

const router = express.Router();

router.use(auth);

router.post('/', validate(bookSessionSchema), bookSession);
router.get('/', listSessions);
router.get('/upcoming', getUpcoming);
router.get('/:sessionId', getSession);
router.put('/:sessionId/confirm', confirmSession);
router.post('/:sessionId/start', startSession);
router.post('/:sessionId/end', endSession);
router.post('/:sessionId/rate', validate(rateSessionSchema), rateSession);
router.get('/:sessionId/token', getSessionToken);
router.post('/:sessionId/cancel', cancelSession);

export default router;
