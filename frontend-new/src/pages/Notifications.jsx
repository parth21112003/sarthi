import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Bell, CheckCheck, Trash2, Calendar, MessageSquare, 
  Star, Info, Filter 
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketContext';
import './Phase2.css';

const typeIcons = {
  meeting_request: <Calendar size={16} color="var(--accent-amber)" />,
  meeting_response: <Calendar size={16} color="var(--accent-green)" />,
  new_message: <MessageSquare size={16} color="var(--primary-light)" />,
  rating: <Star size={16} color="#fdcb6e" />,
  system: <Info size={16} color="var(--accent-cyan)" />,
};

const Notifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.list();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for live pushes
  useEffect(() => {
    if (!socket) return;
    const handleNew = ({ notification }) => {
      setNotifications((curr) => [notification, ...curr]);
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((curr) => curr.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      setNotifications((curr) => curr.filter((n) => !n.isRead));
      toast.success('Cleaned up read notifications');
    } catch {
      toast.error('Failed to delete read notifications');
    }
  };

  const handleDeleteOne = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((curr) => curr.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : activeTab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications.filter((n) => n.type === activeTab);

  return (
    <DashboardLayout title="Notification Center">
      <div className="page-stack">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="var(--primary-light)" /> Notifications & Alerts
              </h3>
              <span className="muted small-text">
                {unreadCount > 0 ? `You have ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {unreadCount > 0 && (
                <Button size="sm" variant="secondary" iconLeft={<CheckCheck size={14} />} onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
              {notifications.some((n) => n.isRead) && (
                <Button size="sm" variant="ghost" iconLeft={<Trash2 size={14} />} onClick={handleDeleteAllRead}>
                  Clear read
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { key: 'all', label: 'All Alerts' },
              { key: 'unread', label: `Unread (${unreadCount})` },
              { key: 'meeting_request', label: 'Meeting Requests' },
              { key: 'meeting_response', label: 'Meeting Updates' },
              { key: 'new_message', label: 'Messages' },
              { key: 'rating', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: activeTab === tab.key ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                  background: activeTab === tab.key ? 'var(--primary-dark)' : 'rgba(255,255,255,0.03)',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications List */}
        <Card>
          {loading ? (
            <div className="flex-center" style={{ minHeight: 240 }}>
              <Spinner text="Loading notifications..." />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={32} />}
              title="No notifications found"
              description="New session bookings, chat messages, and reviews will arrive here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredNotifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '#'}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(108, 92, 231, 0.12)',
                    border: n.isRead ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(162, 155, 254, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {typeIcons[n.type] || <Bell size={16} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <strong style={{ fontSize: 'var(--text-sm)' }}>{n.title}</strong>
                        {!n.isRead && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: 'var(--primary-light)',
                            }}
                          />
                        )}
                      </div>
                      <p className="muted small-text" style={{ margin: '2px 0 0 0' }}>
                        {n.message}
                      </p>
                      <span className="muted" style={{ fontSize: '10px' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteOne(n.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 4,
                      opacity: 0.6,
                      transition: 'opacity var(--transition-fast)',
                    }}
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
