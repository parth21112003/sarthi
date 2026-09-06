/**
 * ==============================================================================
 * CHAT & MESSAGING ROUTES (src/routes/chat.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/chats`
 * 
 * ENDPOINTS:
 * - GET   /api/chats             : List active chat threads for current user
 * - POST  /api/chats             : Find or start a 1-on-1 chat thread with user
 * - GET   /api/chats/:id/messages: Fetch message history for a chat thread
 * - POST  /api/chats/:id/messages: Send a message in a chat thread
 * - PATCH /api/chats/:id/read    : Mark incoming messages in thread as read
 * ==============================================================================
 */

import express from 'express';
import {
  listChats,
  listMessages,
  markChatRead,
  sendMessage,
  startChat,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: List user chat threads
router.get('/', authenticate, listChats);

// Protected: Start or retrieve 1-on-1 chat thread
router.post('/', authenticate, startChat);

// Protected: List message history for chat
router.get('/:id/messages', authenticate, listMessages);

// Protected: Send message in chat thread
router.post('/:id/messages', authenticate, sendMessage);

// Protected: Mark incoming messages in chat as read
router.patch('/:id/read', authenticate, markChatRead);

export default router;
