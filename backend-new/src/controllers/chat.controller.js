/**
 * ==============================================================================
 * CHAT & MESSAGING CONTROLLER (src/controllers/chat.controller.js)
 * ==============================================================================
 * Manages 1-on-1 direct message conversations between students and counselors.
 * 
 * INTEGRATION ARCHITECTURE:
 * - PRISMA DB: Stores `Chat`, `ChatParticipant`, and `Message` entities.
 * - SOCKET.IO BROADCAST: Emits `chat:message` to `chat:${chatId}` WebSocket room.
 * - NOTIFICATION SERVICE: Automatically sends in-app notifications and WebSocket push
 *   alerts (`notification:new`) to message recipients.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { emitToRoom } from '../socket/index.js';
import { createNotification } from '../services/notification.service.js';

// Standard user projection fields for chat messages & participants
const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  stream: true,
  specialization: true,
};

// Message model projection
const messageSelect = {
  id: true,
  chatId: true,
  senderId: true,
  content: true,
  type: true,
  isRead: true,
  createdAt: true,
  sender: { select: userSelect },
};

// Relation inclusion for chat list queries (includes participants & latest message preview)
const chatInclude = {
  participants: {
    include: {
      user: { select: userSelect },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: messageSelect,
  },
};

/**
 * Helper: Find existing 1-on-1 chat between two specific users
 */
const findSharedChat = async (userId, participantId) => {
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: true,
    },
  });

  return chats.find((chat) => {
    const participantIds = chat.participants.map((participant) => participant.userId);
    return participantIds.length === 2 && participantIds.includes(participantId);
  });
};

/**
 * Helper: Check if a user is a participant in a specific chat
 */
const ensureParticipant = async (chatId, userId) => {
  return prisma.chatParticipant.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });
};

/**
 * List Active Chats (`GET /api/chats`)
 * Returns all chat threads where current user is a participant, ordered by last activity.
 */
export const listChats = async (req, res, next) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId: req.user.id },
        },
      },
      include: chatInclude,
      orderBy: [
        { lastAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ chats });
  } catch (error) {
    next(error);
  }
};

/**
 * Start or Retrieve 1-on-1 Chat Thread (`POST /api/chats`)
 * Takes `participantId` in request body.
 * If a chat thread already exists between the two users, returns existing thread.
 * Otherwise creates a new `Chat` and `ChatParticipant` join records.
 */
export const startChat = async (req, res, next) => {
  try {
    const participantId = Number(req.body.participantId);

    if (!participantId || participantId === req.user.id) {
      return res.status(400).json({ error: 'A valid participant is required' });
    }

    // Verify recipient exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, role: true },
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Check for existing conversation thread
    const existingChat = await findSharedChat(req.user.id, participantId);
    if (existingChat) {
      const chat = await prisma.chat.findUnique({
        where: { id: existingChat.id },
        include: chatInclude,
      });
      return res.json({ chat });
    }

    // Create new Chat & ChatParticipant join records
    const chat = await prisma.chat.create({
      data: {
        participants: {
          create: [
            { userId: req.user.id },
            { userId: participantId },
          ],
        },
      },
      include: chatInclude,
    });

    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Message History (`GET /api/chats/:id/messages`)
 * Verifies participant authorization, then returns all messages for `chatId` in chronological order.
 */
export const listMessages = async (req, res, next) => {
  try {
    const chatId = Number(req.params.id);
    const participant = await ensureParticipant(chatId, req.user.id);

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      select: messageSelect,
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

/**
 * Send Message Endpoint (`POST /api/chats/:id/messages`)
 * 
 * MULTI-STEP FLOW:
 * 1. Validates non-empty content and participant membership.
 * 2. Creates Message record in DB (`prisma.message.create`).
 * 3. Updates Chat's `lastMessage` and `lastAt` timestamp.
 * 4. Broadcasts `chat:message` over Socket.IO room `chat:${chatId}` for instant delivery.
 * 5. Generates DB notification & live alert (`notification:new`) for all recipients.
 * 6. Returns HTTP 201 Created with message object.
 */
export const sendMessage = async (req, res, next) => {
  try {
    const chatId = Number(req.params.id);
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // 1. Verify membership
    const participant = await ensureParticipant(chatId, req.user.id);
    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    // 2. Persist Message in DB
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content,
        type: 'text',
      },
      select: messageSelect,
    });

    // 3. Update Chat thread summary
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: content,
        lastAt: message.createdAt,
      },
    });

    // Fetch chat participants for notification dispatch
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: { select: userSelect },
          },
        },
      },
    });

    // 4. Real-time WebSocket Broadcast to chat room
    emitToRoom(`chat:${chatId}`, 'chat:message', { message, chatId });

    // 5. Send push notification to recipients
    const recipients = chat.participants.filter((item) => item.userId !== req.user.id);
    await Promise.all(recipients.map((recipient) => (
      createNotification({
        userId: recipient.userId,
        title: `New message from ${message.sender.name}`,
        message: content.length > 80 ? `${content.slice(0, 77)}...` : content,
        type: 'new_message',
        link: `/${recipient.user.role}/messages?chatId=${chatId}`,
      })
    )));

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Chat Messages as Read (`PATCH /api/chats/:id/read`)
 * Updates all unread incoming messages in `chatId` to `isRead: true`.
 * Emits `chat:read` event over Socket.IO to notify sender of read receipts.
 */
export const markChatRead = async (req, res, next) => {
  try {
    const chatId = Number(req.params.id);
    const participant = await ensureParticipant(chatId, req.user.id);

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    // Bulk update unread messages from opposing sender
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: req.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Broadcast read receipt event over WebSocket
    emitToRoom(`chat:${chatId}`, 'chat:read', {
      chatId,
      readerId: req.user.id,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
