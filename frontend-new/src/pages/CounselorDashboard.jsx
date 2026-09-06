import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Calendar, Star, TrendingUp, MessageSquare, 
  Video, Clock, BookOpen, CheckCircle 
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import './Dashboard.css';

const CounselorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.summary()
      .then((data) => setSummary(data.summary || {}))
      .catch(() => setSummary({}))
      .finally(() => setLoading(false));
  }, []);

  const upcomingMeetings = summary.upcomingMeetings || [];
  const scoreDist = summary.scoreDist || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalReviews = summary.totalRatings || 0;

  return (
    <DashboardLayout title="Counselor Practice Overview">
      {loading ? (
        <div className="flex-center" style={{ minHeight: 320 }}>
          <Spinner text="Loading counselor dashboard..." />
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Welcome Banner */}
          <Card className="welcome-card span-full" padding="lg">
            <div className="welcome-content">
              <h2>Welcome, Counselor {user?.name?.split(' ')[0]}!</h2>
              <p>
                You have {summary.acceptedMeetings ?? 0} confirmed sessions scheduled, and {summary.pendingMeetings ?? 0} new student requests awaiting your review.
              </p>
            </div>
          </Card>

          {/* Key Metric Counters */}
          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><Users size={20} /></div>
              <Badge variant="info">Students</Badge>
            </div>
            <h3>{summary.uniqueStudents ?? 0}</h3>
            <p>Unique Students Advised</p>
          </Card>

          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><Calendar size={20} /></div>
              <Badge variant="warning">{summary.pendingMeetings ?? 0} pending</Badge>
            </div>
            <h3>{summary.acceptedMeetings ?? 0}</h3>
            <p>Confirmed Sessions</p>
          </Card>

          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><Star size={20} /></div>
              <Badge variant="success">{summary.totalRatings ?? 0} reviews</Badge>
            </div>
            <h3>{Number(summary.rating || 0).toFixed(1)} ★</h3>
            <p>Average Rating</p>
          </Card>

          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><TrendingUp size={20} /></div>
              <Badge variant="default">All-time</Badge>
            </div>
            <h3>{summary.completedMeetings ?? 0}</h3>
            <p>Completed Consultations</p>
          </Card>

          {/* Upcoming Video Consultations */}
          <Card className="span-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Upcoming Student Consultations</h3>
                <span className="muted small-text">Your next confirmed meetings with 1-click video joining</span>
              </div>
              <Link to="/counselor/meetings">
                <Button variant="ghost" size="sm">Manage Requests ({summary.pendingMeetings ?? 0})</Button>
              </Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p className="muted small-text" style={{ margin: 0 }}>
                  No upcoming confirmed meetings scheduled. Make sure your availability slots are set up in your Schedule.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
                {upcomingMeetings.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{m.student?.name}</strong>
                      <div className="muted small-text">{m.topic || 'General Consultation'}</div>
                      <div className="muted small-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 4 }}>
                        <Calendar size={12} /> {m.date} | <Clock size={12} /> {m.startTime}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      iconLeft={<Video size={14} />}
                      onClick={() => navigate(`/call/${m.id}`)}
                    >
                      Join Room
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Rating & Performance Breakdown */}
          <Card className="span-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Student Rating Breakdown ({totalReviews} Reviews)</h3>
                <span className="muted small-text">Your satisfaction metrics calculated from student feedback</span>
              </div>
              <Link to="/counselor/session-notes">
                <Button variant="secondary" size="sm" iconLeft={<BookOpen size={14} />}>
                  Session Notes
                </Button>
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 'var(--space-6)', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fdcb6e', lineHeight: 1 }}>
                  {Number(summary.rating || 0).toFixed(1)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, margin: '8px 0' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(Number(summary.rating || 0)) ? '#fdcb6e' : 'none'}
                      color={i < Math.round(Number(summary.rating || 0)) ? '#fdcb6e' : 'rgba(255,255,255,0.2)'}
                    />
                  ))}
                </div>
                <span className="muted small-text">Overall Practice Score</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = scoreDist[star] || 0;
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-xs)' }}>
                      <span style={{ width: 36 }}>{star} Stars</span>
                      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#fdcb6e', borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 28, textAlign: 'right', color: 'var(--text-muted)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CounselorDashboard;
