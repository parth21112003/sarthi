/**
 * ==============================================================================
 * NOTIFICATION ROUTES (src/routes/notification.routes.js)
 * ==============================================================================
 * Route Base Prefix: `/api/notifications`
 * 
 * ENDPOINTS:
 * - GET   /api/notifications          : List notifications & unread count
 * - PATCH /api/notifications/read-all : Mark all notifications as read
 * - PATCH /api/notifications/:id/read : Mark single notification as read
 * ==============================================================================
 */

import express from 'express';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  deleteAllRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected: List notifications for current user
router.get('/', authenticate, listNotifications);

// Protected: Mark all notifications as read
router.patch('/read-all', authenticate, markAllNotificationsRead);

// Protected: Delete all read notifications
router.delete('/read', authenticate, deleteAllRead);

// Protected: Mark single notification as read
router.patch('/:id/read', authenticate, markNotificationRead);

// Protected: Delete single notification
router.delete('/:id', authenticate, deleteNotification);

export default router;
