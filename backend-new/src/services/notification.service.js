/**
 * ==============================================================================
 * NOTIFICATION SERVICE LAYER (src/services/notification.service.js)
 * ==============================================================================
 * Abstraction layer for generating in-app notifications across features
 * (meeting requests, meeting status updates, new messages, ratings).
 * 
 * DUAL NOTIFICATION PATTERN:
 * 1. PERSISTENCE: Inserts a new `Notification` record into the PostgreSQL database via Prisma.
 * 2. REAL-TIME PUSH: Simultaneously dispatches a `notification:new` WebSocket event
 *    to the target user's Socket.IO room (`user:${userId}`).
 * ==============================================================================
 */

import prisma from '../config/prisma.js';
import { emitToUser } from '../socket/index.js';

/**
 * Creates a notification record and sends a real-time WebSocket push alert.
 * 
 * @param {Object} params - Notification details
 * @param {number} params.userId - Target recipient user ID
 * @param {string} params.title - Short header (e.g. "New meeting request")
 * @param {string} params.message - Body text
 * @param {string} params.type - Category ('meeting_request', 'meeting_response', 'new_message', 'rating', 'system')
 * @param {string} [params.link] - Optional frontend route link (e.g. "/counselor/meetings")
 * @returns {Promise<Object>} Created Prisma Notification model instance
 */
export const createNotification = async ({ userId, title, message, type, link }) => {
  // 1. Save notification record in database
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link: link || null,
    },
  });

  // 2. Broadcast live alert over WebSocket to recipient's socket room
  emitToUser(userId, 'notification:new', { notification });

  return notification;
};
