import { StreamClient } from '@stream-io/node-sdk';
import jwt from 'jsonwebtoken';
import axios from 'axios';

let streamClient = null;

const getClient = () => {
  if (!streamClient) {
    if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      throw new Error('Stream.io API keys not configured');
    }
    streamClient = new StreamClient(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET
    );
  }
  return streamClient;
};

/**
 * Register a user with Stream.io
 * @param {string} userId - MongoDB user ID (used as Stream user ID)
 * @param {string} name - Display name
 * @param {string} avatar - Avatar URL
 * @returns {Promise<string>} The Stream user ID
 */
export const createStreamUser = async (userId, name, avatar = '') => {
  const client = getClient();
  await client.upsertUsers([
    {
      id: userId,
      name,
      image: avatar || undefined,
      role: 'user',
    },
  ]);
  return userId;
};

/**
 * Create a Stream Video call for a session
 * @param {string} sessionId - MongoDB session ID used as call ID
 * @returns {Promise<{ callId: string, callType: string }>}
 */
export const createCall = async (sessionId, createdById) => {
  const client = getClient();
  const callType = 'default';
  const call = client.video.call(callType, sessionId);
  await call.create({
    data: {
      members: [],
      settings_override: {
        recording: { mode: 'disabled' },
      },
      created_by_id: createdById,
    },
  });
  return { callId: sessionId, callType };
};

/**
 * Add members to a Stream Video call
 * @param {string} callId - Stream call ID
 * @param {string[]} userIds - Array of user IDs to add
 */
export const addCallMembers = async (callId, userIds) => {
  const client = getClient();
  const call = client.video.call('default', callId);
  await call.updateCallMembers({
    update_members: userIds.map((id) => ({ user_id: id })),
  });
};

/**
 * Generate a Stream user token for joining video calls and chat
 * @param {string} userId - The user's Stream ID (same as MongoDB _id)
 * @returns {string} Stream user token
 */
export const generateUserToken = (userId) => {
  const client = getClient();
  return client.generateUserToken({ user_id: userId });
};

/**
 * End a Stream Video call
 * @param {string} callId - Stream call ID to end
 */
export const endCall = async (callId) => {
  try {
    const client = getClient();
    const call = client.video.call('default', callId);
    await call.end();
  } catch (err) {
    console.warn('Stream endCall error (may already be ended):', err.message);
  }
};
/**
 * Generate a Stream Chat-compatible user token
 * Uses the same HS256 JWT format that the stream-chat server SDK produces.
 * @param {string} userId
 * @returns {string} JWT token for Stream Chat
 */
export const generateChatToken = (userId) => {
  const secret = process.env.STREAM_API_SECRET;
  if (!secret) throw new Error('STREAM_API_SECRET not configured');
  return jwt.sign({ user_id: userId }, secret, { algorithm: 'HS256' });
};

/**
 * Build a server-side JWT for Stream Chat admin API calls
 */
const buildServerToken = () => {
  const secret = process.env.STREAM_API_SECRET;
  return jwt.sign({ server: true }, secret, { algorithm: 'HS256' });
};

/**
 * Create (or update) a Stream Chat messaging channel server-side,
 * ensuring all participants are members from the start.
 * Uses POST /channels/{type}/{id} (create/upsert), not /query (watch).
 * @param {string} channelId - Unique channel ID (we use the sessionId)
 * @param {string[]} memberIds - User IDs to add as members
 */
export const createChatChannel = async (channelId, memberIds) => {
  const apiKey = process.env.STREAM_API_KEY;
  const secret = process.env.STREAM_API_SECRET;
  if (!apiKey || !secret) return;

  const createdById = memberIds[0];
  const serverToken = buildServerToken();

  // POST /channels/{type}/{id} — creates or updates the channel with members
  const url = `https://chat.stream-io-api.com/channels/messaging/${channelId}`;
  await axios.post(
    url,
    {
      data: { created_by_id: createdById },
      members: memberIds.map((id) => ({ user_id: id })),
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: serverToken,
        'stream-auth-type': 'jwt',
      },
      params: { api_key: apiKey },
    }
  );
};
