import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

let videoClientInstance = null;
let videoClientUserId = null;

let chatClientInstance = null;
let chatClientUserId = null;

/**
 * Get or create a Stream Video client for a user
 * @param {string} userId - The user's ID
 * @param {string} token - Stream user token from backend
 * @param {string} name - Display name
 * @param {string} image - Avatar URL
 */
export const getVideoClient = (userId, token, name = '', image = '') => {
  if (videoClientInstance) {
    if (videoClientUserId === userId) {
      return videoClientInstance;
    }
    // Disconnect old client if user ID changed
    videoClientInstance.disconnectUser().catch(() => {});
    videoClientInstance = null;
    videoClientUserId = null;
  }

  if (!STREAM_API_KEY) {
    console.warn('NEXT_PUBLIC_STREAM_API_KEY not set — Stream video disabled');
    return null;
  }

  videoClientInstance = new StreamVideoClient({
    apiKey: STREAM_API_KEY,
    user: { id: userId, name, image },
    token,
    options: {
      logOptions: {
        default: {
          level: 'error',
          sink: () => {}, // Swallow internal SDK console logs/errors
        },
      },
    },
  });

  videoClientUserId = userId;
  return videoClientInstance;
};

/**
 * Disconnect and reset the video client (call on logout)
 */
export const disconnectVideoClient = async () => {
  if (videoClientInstance) {
    await videoClientInstance.disconnectUser().catch(() => {});
    videoClientInstance = null;
    videoClientUserId = null;
  }
};

/**
 * Get or create a Stream Chat client
 * @param {string} userId
 * @param {string} token
 * @param {string} name
 * @param {string} image
 */
export const getChatClient = async (userId, token, name = '', image = '') => {
  if (chatClientInstance) {
    if (chatClientUserId === userId) {
      return chatClientInstance;
    }
    // Disconnect old client if user ID changed
    await chatClientInstance.disconnectUser().catch(() => {});
    chatClientInstance = null;
    chatClientUserId = null;
  }

  if (!STREAM_API_KEY) return null;

  chatClientInstance = StreamChat.getInstance(STREAM_API_KEY);
  
  if (chatClientInstance.userID && chatClientInstance.userID !== userId) {
    await chatClientInstance.disconnectUser().catch(() => {});
  }

  if (!chatClientInstance.userID) {
    await chatClientInstance.connectUser({ id: userId, name, image }, token);
  }
  
  chatClientUserId = userId;
  return chatClientInstance;
};

/**
 * Disconnect Stream Chat client
 */
export const disconnectChatClient = async () => {
  if (chatClientInstance) {
    await chatClientInstance.disconnectUser().catch(() => {});
    chatClientInstance = null;
    chatClientUserId = null;
  }
};
