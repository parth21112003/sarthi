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
  Users, Calendar, MessageSquare, FileQuestion, 
  Video, Sparkles, Clock, CheckCircle2, ArrowRight 
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import counselorService from '../services/counselorService';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashData, recData] = await Promise.all([
          dashboardService.summary(),
          counselorService.getRecommended(3),
        ]);
        setSummary(dashData.summary || {});
        setRecommendations(recData.counselors || []);
      } catch {
        setSummary({});
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const latestAptitude = summary.latestAptitude;
  const upcomingMeetings = summary.upcomingMeetings || [];

  return (
    <DashboardLayout title="Student Overview">
      {loading ? (
        <div className="flex-center" style={{ minHeight: 320 }}>
          <Spinner text="Loading dashboard metrics..." />
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Welcome Banner */}
          <Card className="welcome-card span-full" padding="lg">
            <div className="welcome-content">
              <h2>Welcome back, {user?.name?.split(' ')[0]}!</h2>
              <p>
                {latestAptitude
                  ? `Your dominant aptitude stream is aligned with ${latestAptitude.streamRecommendation}. Explore recommended counselors below.`
                  : 'Take your career aptitude assessment to unlock tailored counselor matches and career roadmap recommendations.'}
              </p>
            </div>
          </Card>

          {/* Stat Cards */}
          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><Users size={20} /></div>
              <Badge variant="success">Active</Badge>
            </div>
            <h3>{summary.availableCounselors ?? 0}</h3>
            <p>Available Counselors</p>
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
              <div className="stat-icon"><MessageSquare size={20} /></div>
              <Badge variant="info">{summary.unreadMessages ?? 0} unread</Badge>
            </div>
            <h3>{summary.meetingsTotal ?? 0}</h3>
            <p>Total Booked Sessions</p>
          </Card>

          <Card className="stat-card">
            <div className="stat-header">
              <div className="stat-icon"><FileQuestion size={20} /></div>
              <Badge variant={summary.aptitudeTests ? 'success' : 'danger'}>
                {summary.aptitudeTests ? `${summary.aptitudeTests} Taken` : 'Pending'}
              </Badge>
            </div>
            <h3>{latestAptitude ? `${latestAptitude.totalScore} pts` : 'Not Taken'}</h3>
            <p>Aptitude Assessment</p>
          </Card>

          {/* Upcoming Sessions Agenda */}
          <Card className="span-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Upcoming Counseling Agenda</h3>
                <span className="muted small-text">Your next confirmed 1-on-1 video sessions</span>
              </div>
              <Link to="/student/meetings">
                <Button variant="ghost" size="sm">View All ({summary.meetingsTotal ?? 0})</Button>
              </Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p className="muted small-text" style={{ margin: 0 }}>
                  No upcoming confirmed meetings scheduled. Browse counselors to book a session.
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
                      <strong>{m.counselor?.name}</strong>
                      <div className="muted small-text">{m.topic || 'Career Consultation'}</div>
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
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Smart Recommended Counselors Preview */}
          {recommendations.length > 0 && (
            <Card className="span-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary-light)" />
                  <h3 style={{ margin: 0 }}>Top Counselor Matches For You</h3>
                </div>
                <Link to="/student/counselors">
                  <Button variant="ghost" size="sm">Explore All</Button>
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                {recommendations.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Avatar name={c.name} size="sm" isOnline={false} />
                        <div>
                          <strong style={{ fontSize: 'var(--text-sm)' }}>{c.name}</strong>
                          <div className="muted small-text">{c.specialization || c.stream}</div>
                        </div>
                      </div>
                      <Badge variant="success">{c.matchPercentage}%</Badge>
                    </div>

                    <div className="meta-row">
                      <span className="small-text">{c.experience || 0} yrs</span>
                      <span className="small-text" style={{ color: '#fdcb6e' }}>★ {c.rating?.toFixed(1) || '0.0'}</span>
                    </div>

                    <Link to={`/student/counselors/${c.id}`} style={{ marginTop: 'auto' }}>
                      <Button size="sm" variant="secondary" className="w-full">View & Book</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Aptitude Assessment Progress Card */}
          {latestAptitude && latestAptitude.scores && (
            <Card className="span-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Your Aptitude Profile Breakdown</h3>
                  <span className="muted small-text">Scores across 5 key career dimensions</span>
                </div>
                <Link to="/student/aptitude">
                  <Button variant="ghost" size="sm">Retake / Details</Button>
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
                {Object.entries(latestAptitude.scores).map(([category, score]) => {
                  const maxPoints = 20; // 5 questions * 4 pts
                  const pct = Math.min(100, Math.round((score / maxPoints) * 100));
                  return (
                    <div
                      key={category}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{category}</span>
                        <span>{score} pts</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-light)', borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
