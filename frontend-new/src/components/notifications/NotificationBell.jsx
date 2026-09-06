import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useSocket } from '../../context/SocketContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.list();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = ({ notification }) => {
      setNotifications((current) => [notification, ...current].slice(0, 30));
      setUnreadCount((current) => current + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket]);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  return (
    <div className="notification-menu">
      <button className="notification-btn" onClick={() => setIsOpen(!isOpen)} title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel glass-card">
          <div className="notification-panel-header">
            <h3>Notifications</h3>
            <button onClick={markAllRead} title="Mark all read">
              <CheckCheck size={18} />
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.link || '#'}
                className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                onClick={() => setIsOpen(false)}
              >
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
              </Link>
            ))}
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <Link
              to="/student/notifications"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}
            >
              Open Full Notification Center →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
