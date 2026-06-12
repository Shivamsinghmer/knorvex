import express from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getConversations, getConversation, sendMessage, acceptRequest, getRequests,
  unsendMessage, sendMessageSchema,
} from '../controllers/messageController.js';

const router = express.Router();

router.use(auth);

router.get('/requests', getRequests);
router.get('/conversations', getConversations);
router.get('/conversations/:userId', getConversation);
router.post('/', validate(sendMessageSchema), sendMessage);
router.put('/:conversationId/accept', acceptRequest);
router.delete('/:messageId', unsendMessage);

export default router;
