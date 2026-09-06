import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Star, Users, Sparkles, Filter, CheckCircle2, MessageSquare } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import counselorService from '../services/counselorService';
import chatService from '../services/chatService';
import './Phase2.css';

const streams = ['', 'Science', 'Commerce', 'Arts', 'Engineering', 'Medical', 'Design', 'Management'];

const CounselorDirectory = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', stream: '', minRating: '', sortBy: 'rating' });
  const [counselors, setCounselors] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState(null);

  const handleStartChat = async (counselorId) => {
    setStartingChatId(counselorId);
    try {
      const data = await chatService.start(counselorId);
      navigate(`/student/messages?chatId=${data.chat.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not start chat');
    } finally {
      setStartingChatId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [counselorsData, recommendedData] = await Promise.all([
        counselorService.list(filters),
        counselorService.getRecommended(3),
      ]);
      setCounselors(counselorsData.counselors || []);
      setRecommended(recommendedData.counselors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadData();
  };

  return (
    <DashboardLayout title="Find & Match Counselors">
      <div className="page-stack">
        {/* Recommended For You Section */}
        {recommended.length > 0 && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Sparkles size={20} color="var(--primary-light)" />
              <h3 style={{ margin: 0 }}>Smart Matches For You</h3>
              <span className="muted small-text" style={{ marginLeft: 'var(--space-2)' }}>
                Based on your academic stream, aptitude assessment, and counselor ratings
              </span>
            </div>

            <div className="cards-grid" style={{ marginBottom: 'var(--space-2)' }}>
              {recommended.map((counselor) => (
                <Card
                  key={`rec-${counselor.id}`}
                  hover
                  className="entity-card"
                  style={{
                    background: 'linear-gradient(145deg, rgba(108, 92, 231, 0.12), rgba(255, 255, 255, 0.03))',
                    border: '1px solid rgba(162, 155, 254, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="entity-header">
                      <Avatar name={counselor.name} size="md" isOnline={false} />
                      <div className="entity-title">
                        <h4 style={{ margin: 0 }}>{counselor.name}</h4>
                        <span className="muted small-text">{counselor.specialization || counselor.stream}</span>
                      </div>
                    </div>
                    <Badge variant="success">
                      {counselor.matchPercentage}% Match
                    </Badge>
                  </div>

                  {counselor.matchFactors && counselor.matchFactors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                      {counselor.matchFactors.slice(0, 2).map((factor, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            color: '#a0a0b0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <CheckCircle2 size={12} color="var(--accent-green)" /> {factor}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="meta-row">
                    <Badge variant="info">{counselor.experience || 0} yrs exp</Badge>
                    <Badge variant="warning">
                      <Star size={12} fill="currentColor" /> {counselor.rating?.toFixed?.(1) || '0.0'} ({counselor.totalRatings || 0})
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <Link to={`/student/counselors/${counselor.id}`} style={{ flex: 1 }}>
                      <Button className="w-full" size="sm" variant="primary">View Profile & Book</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<MessageSquare size={14} />}
                      loading={startingChatId === counselor.id}
                      onClick={() => handleStartChat(counselor.id)}
                    >
                      Chat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Filter Toolbar */}
        <Card>
          <form className="toolbar" onSubmit={handleSubmit} style={{ gridTemplateColumns: '1fr 180px 160px 160px auto' }}>
            <Input
              label="Search"
              placeholder="Name, stream, or domain"
              icon={<Search size={18} />}
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
            <label className="input-wrapper">
              <span className="input-label">Stream</span>
              <select
                className="native-select"
                value={filters.stream}
                onChange={(event) => setFilters({ ...filters, stream: event.target.value })}
              >
                {streams.map((stream) => (
                  <option key={stream || 'all'} value={stream}>
                    {stream || 'All streams'}
                  </option>
                ))}
              </select>
            </label>

            <label className="input-wrapper">
              <span className="input-label">Min Rating</span>
              <select
                className="native-select"
                value={filters.minRating}
                onChange={(event) => setFilters({ ...filters, minRating: event.target.value })}
              >
                <option value="">Any Rating</option>
                <option value="4">4.0+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </label>

            <label className="input-wrapper">
              <span className="input-label">Sort By</span>
              <select
                className="native-select"
                value={filters.sortBy}
                onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })}
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Alphabetical</option>
              </select>
            </label>

            <Button type="submit">Filter</Button>
          </form>
        </Card>

        {loading ? (
          <div className="flex-center" style={{ minHeight: 240 }}>
            <Spinner text="Finding counselors" />
          </div>
        ) : counselors.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users size={28} />}
              title="No counselors found"
              description="Try adjusting your filters or search keywords."
            />
          </Card>
        ) : (
          <div className="cards-grid">
            {counselors.map((counselor) => (
              <Card key={counselor.id} hover className="entity-card">
                <div className="entity-header">
                  <Avatar name={counselor.name} size="md" isOnline={false} />
                  <div className="entity-title">
                    <h3>{counselor.name}</h3>
                    <span className="muted small-text">{counselor.specialization || counselor.stream || 'Career Counselor'}</span>
                  </div>
                </div>
                <p className="muted small-text" style={{ flex: 1 }}>
                  {counselor.bio || 'Guides students through academic choices and strategic career pathways.'}
                </p>
                <div className="meta-row">
                  <Badge variant="info">{counselor.experience || 0} yrs exp</Badge>
                  <Badge variant="warning">
                    <Star size={12} fill="currentColor" /> {counselor.rating?.toFixed?.(1) || '0.0'} ({counselor.totalRatings || 0})
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Link to={`/student/counselors/${counselor.id}`} style={{ flex: 1 }}>
                    <Button className="w-full" variant="secondary">View Profile</Button>
                  </Link>
                  <Button
                    variant="primary"
                    iconLeft={<MessageSquare size={16} />}
                    loading={startingChatId === counselor.id}
                    onClick={() => handleStartChat(counselor.id)}
                  >
                    Chat
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CounselorDirectory;
