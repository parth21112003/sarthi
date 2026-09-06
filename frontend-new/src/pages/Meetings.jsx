import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle, Clock, Star, XCircle, BookOpen, Video } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import meetingService from '../services/meetingService';
import ratingService from '../services/ratingService';
import './Phase2.css';
import './Phase4.css';

const statusVariant = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  cancelled: 'default',
  completed: 'info',
};

const Meetings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingForm, setRatingForm] = useState({ score: 5, review: '' });
  const [ratingLoading, setRatingLoading] = useState(false);
  const isCounselor = user?.role === 'counselor';

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const data = await meetingService.listMine();
      setMeetings(data.meetings || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const updateStatus = async (meetingId, status) => {
    try {
      await meetingService.updateStatus(meetingId, status);
      toast.success(`Meeting ${status}`);
      loadMeetings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update meeting');
    }
  };

  const submitRating = async () => {
    if (!ratingTarget) return;
    setRatingLoading(true);
    try {
      await ratingService.create({
        counselorId: ratingTarget.counselorId,
        score: ratingForm.score,
        review: ratingForm.review,
      });
      toast.success('Review submitted');
      setRatingTarget(null);
      setRatingForm({ score: 5, review: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not submit review');
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <DashboardLayout title={isCounselor ? 'Meeting Requests' : 'My Meetings'}>
      <Card>
        {loading ? (
          <div className="flex-center" style={{ minHeight: 260 }}>
            <Spinner text="Loading meetings" />
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title="No meetings yet"
            description={isCounselor ? 'New student requests will appear here.' : 'Book a counsellor to start your first session.'}
          />
        ) : (
          <div className="meeting-list">
            {meetings.map((meeting) => {
              const person = isCounselor ? meeting.student : meeting.counselor;
              return (
                <div className="meeting-row" key={meeting.id}>
                  <div className="meeting-main">
                    <strong>{person?.name}</strong>
                    <span className="muted small-text">
                      {meeting.date} at {meeting.startTime} - {meeting.endTime}
                    </span>
                    <span className="muted small-text">{meeting.topic || 'General career guidance'}</span>
                  </div>
                  <div className="meeting-actions">
                    <Badge variant={statusVariant[meeting.status] || 'default'}>
                      {meeting.status}
                    </Badge>
                    {isCounselor && meeting.status === 'pending' && (
                      <>
                        <Button size="sm" iconLeft={<CheckCircle size={16} />} onClick={() => updateStatus(meeting.id, 'accepted')}>Accept</Button>
                        <Button size="sm" variant="danger" iconLeft={<XCircle size={16} />} onClick={() => updateStatus(meeting.id, 'rejected')}>Reject</Button>
                      </>
                    )}
                    {meeting.status === 'accepted' && (
                      <Button
                        size="sm"
                        variant="primary"
                        iconLeft={<Video size={16} />}
                        onClick={() => navigate(`/call/${meeting.id}`)}
                      >
                        Join Call
                      </Button>
                    )}
                    {isCounselor && meeting.status === 'accepted' && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(meeting.id, 'completed')}>Mark Done</Button>
                    )}
                    {!isCounselor && ['pending', 'accepted'].includes(meeting.status) && (
                      <Button size="sm" variant="secondary" iconLeft={<Clock size={16} />} onClick={() => updateStatus(meeting.id, 'cancelled')}>Cancel</Button>
                    )}
                    {meeting.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={<BookOpen size={15} />}
                        onClick={() => navigate(isCounselor ? '/counselor/session-notes' : '/student/session-notes')}
                      >
                        {isCounselor ? 'Notes' : 'View Notes'}
                      </Button>
                    )}
                    {!isCounselor && meeting.status === 'completed' && (
                      <Button size="sm" variant="secondary" iconLeft={<Star size={16} />} onClick={() => setRatingTarget(meeting)}>Rate</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(ratingTarget)}
        onClose={() => setRatingTarget(null)}
        title="Rate Counselor"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setRatingTarget(null)}>Cancel</Button>
            <Button onClick={submitRating} isLoading={ratingLoading}>Submit Review</Button>
          </>
        )}
      >
        <div className="page-stack">
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                className={`rating-star ${score <= ratingForm.score ? 'active' : ''}`}
                onClick={() => setRatingForm({ ...ratingForm, score })}
              >
                <Star size={28} fill="currentColor" />
              </button>
            ))}
          </div>
          <Input
            label="Review"
            type="textarea"
            value={ratingForm.review}
            onChange={(event) => setRatingForm({ ...ratingForm, review: event.target.value })}
            placeholder="Share what was helpful in this session."
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Meetings;
