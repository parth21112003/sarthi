/**
 * ==============================================================================
 * NOTIFICATION CONTROLLER (src/controllers/notification.controller.js)
 * ==============================================================================
 * Manages user notification retrieval and read status updates.
 * ==============================================================================
 */

import prisma from '../config/prisma.js';

/**
 * List Notifications (`GET /api/notifications`)
 * Returns the top 30 most recent notifications for current user,
 * along with total unread count.
 */
export const listNotifications = async (req, res, next) => {
  try {
    // Query notifications for authenticated user
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Count total unread items
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Single Notification as Read (`PATCH /api/notifications/:id/read`)
 * Verifies ownership of notification, then sets `isRead: true`.
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    res.json({ notification: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark All Notifications as Read (`PATCH /api/notifications/read-all`)
 * Bulk updates all unread notifications for current user to `isRead: true`.
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Single Notification (DELETE /api/notifications/:id)
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: notification.id },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete All Read Notifications (DELETE /api/notifications/read)
 */
export const deleteAllRead = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id, isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

