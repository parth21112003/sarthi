import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Clock, Star, MessageSquare, CheckCircle, Award } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import counselorService from '../services/counselorService';
import chatService from '../services/chatService';
import meetingService from '../services/meetingService';
import ratingService from '../services/ratingService';
import './Phase2.css';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CounselorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  // 14-day booking calendar
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  // Slots for the selected date
  const [daySlots, setDaySlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate next 14 calendar days
  const calendarDays = Array.from({ length: 14 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() + index);
    const dateStr = d.toISOString().split('T')[0];
    return {
      date: dateStr,
      dayNum: d.getDate(),
      dayName: dayNames[d.getDay()],
      dayOfWeek: d.getDay(),
    };
  });

  useEffect(() => {
    const loadProfileAndReviews = async () => {
      setLoading(true);
      try {
        const [counselorData, reviewsData] = await Promise.all([
          counselorService.getById(id),
          ratingService.listForCounselor(id),
        ]);
        setCounselor(counselorData.counselor);
        setReviews(reviewsData.ratings || []);
        if (reviewsData.breakdown) {
          setBreakdown(reviewsData.breakdown);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfileAndReviews();
  }, [id]);

  // When date is selected, query slots and booked sessions
  useEffect(() => {
    if (!selectedDate || !counselor) {
      setDaySlots([]);
      setBookedSlots([]);
      setSelectedSlot(null);
      return;
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const slotsForDay = (counselor.availabilitySlots || []).filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive
    );
    setDaySlots(slotsForDay);
    setSelectedSlot(null);

    const fetchBooked = async () => {
      setLoadingSlots(true);
      try {
        const data = await counselorService.getBookedSlots(id, selectedDate);
        setBookedSlots(data.bookedSlots || []);
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchBooked();
  }, [selectedDate, counselor, id]);

  const isSlotBooked = (slot) => {
    return bookedSlots.some(
      (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
    );
  };

  const handleSlotClick = (slot) => {
    if (isSlotBooked(slot)) return;
    setSelectedSlot(slot);
  };

  const handleBook = async (event) => {
    event.preventDefault();
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please choose an available time slot');
      return;
    }

    setBooking(true);
    try {
      await meetingService.create({
        counselorId: Number(id),
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        topic: topic.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Meeting request sent to counselor!');
      navigate('/student/meetings');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not book meeting');
    } finally {
      setBooking(false);
    }
  };

  const handleMessage = async () => {
    try {
      const data = await chatService.start(Number(id));
      navigate(`/student/messages?chatId=${data.chat.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not start chat');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Counselor Profile">
        <div className="flex-center" style={{ minHeight: 320 }}>
          <Spinner text="Loading profile & availability..." />
        </div>
      </DashboardLayout>
    );
  }

  const totalReviewsCount = counselor.totalRatings || reviews.length;

  return (
    <DashboardLayout title={counselor?.name || 'Counselor Profile'}>
      <div className="detail-grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Profile Bio & Reviews */}
        <div className="page-stack">
          {/* Profile Card */}
          <Card className="entity-card">
            <div className="entity-header">
              <Avatar name={counselor.name} size="lg" isOnline={false} />
              <div className="entity-title">
                <h2>{counselor.name}</h2>
                <span className="muted">{counselor.specialization || 'Career Counselor'}</span>
              </div>
            </div>
            <div className="meta-row">
              <Badge variant="info">{counselor.experience || 0} years experience</Badge>
              <Badge variant="warning">
                <Star size={12} fill="currentColor" /> {counselor.rating?.toFixed?.(1) || '0.0'} rating
              </Badge>
              {counselor.stream && <Badge>{counselor.stream}</Badge>}
            </div>
            <p className="muted" style={{ lineHeight: '1.6' }}>
              {counselor.bio || 'Professional counselor committed to helping students find the right educational stream, target universities, and career pathways.'}
            </p>
            <Button variant="secondary" iconLeft={<MessageSquare size={16} />} onClick={handleMessage}>
              Message Counselor
            </Button>
          </Card>

          {/* Student Reviews & Rating Distribution */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Student Reviews ({totalReviewsCount})</h3>
                <span className="muted small-text">Feedback verified from completed sessions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={24} fill="#fdcb6e" color="#fdcb6e" />
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counselor.rating?.toFixed?.(1) || '0.0'}</span>
                <span className="muted small-text">/ 5</span>
              </div>
            </div>

            {/* Star Distribution Histogram */}
            {totalReviewsCount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] || 0;
                  const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)' }}>
                      <span style={{ width: 28 }}>{star} ★</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#fdcb6e', borderRadius: 3 }} />
                      </div>
                      <span style={{ width: 24, textAlign: 'right', color: 'var(--text-muted)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review Cards List */}
            {reviews.length === 0 ? (
              <p className="muted small-text">No student reviews written yet. Completed sessions will show feedback here.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>{r.student?.name || 'Student'}</strong>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            size={12}
                            fill={idx < r.score ? '#fdcb6e' : 'none'}
                            color={idx < r.score ? '#fdcb6e' : 'rgba(255,255,255,0.2)'}
                          />
                        ))}
                      </div>
                    </div>
                    {r.review && (
                      <p className="muted small-text" style={{ margin: '4px 0 0 0', lineHeight: 1.5 }}>
                        "{r.review}"
                      </p>
                    )}
                    <span className="muted" style={{ fontSize: '10px', display: 'block', marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Visual Availability Booking Form */}
        <Card>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0 }}>Schedule a Session</h3>
            <span className="muted small-text">Select an open slot from the counselor's schedule</span>
          </div>

          <form className="page-stack" onSubmit={handleBook}>
            {/* Step 1: 14-Day Visual Date Picker */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
                1. Select Consultation Date
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  overflowX: 'auto',
                  paddingBottom: 'var(--space-2)',
                }}
              >
                {calendarDays.map((d) => {
                  const isSelected = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      style={{
                        minWidth: 54,
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid var(--primary-light)' : '1px solid var(--glass-border)',
                        background: isSelected
                          ? 'linear-gradient(135deg, var(--primary-dark), var(--primary-light))'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#fff' : 'var(--text-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }}>{d.dayName}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{d.dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Time Slot Picker */}
            {selectedDate && (
              <div>
                <label className="input-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
                  2. Choose Available Time Slot
                </label>

                {loadingSlots ? (
                  <div className="flex-center" style={{ padding: 'var(--space-4)' }}>
                    <Spinner text="Verifying slots..." />
                  </div>
                ) : daySlots.length === 0 ? (
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed var(--glass-border)',
                      textAlign: 'center',
                    }}
                  >
                    <p className="muted small-text" style={{ margin: 0 }}>
                      The counselor does not have scheduled slots on this day. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="slot-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
                    {daySlots.map((slot) => {
                      const booked = isSlotBooked(slot);
                      const isSelected = selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={booked}
                          onClick={() => handleSlotClick(slot)}
                          className={`slot-btn ${isSelected ? 'slot-btn-selected' : ''} ${booked ? 'slot-btn-booked' : ''}`}
                          style={{
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: booked ? 'not-allowed' : 'pointer',
                            opacity: booked ? 0.45 : 1,
                          }}
                        >
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span style={{ fontSize: '10px', color: booked ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                            {booked ? 'Booked' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Discussion Topic & Consultation Notes */}
            {selectedSlot && (
              <>
                <Input
                  label="Discussion Topic"
                  placeholder="E.g. Computer Science College Options, Roadmap"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
                <Input
                  label="Notes for Counselor"
                  type="textarea"
                  placeholder="Detail your questions, specific challenges, or questions you would like addressed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <Button type="submit" variant="primary" loading={booking} className="w-full">
                  Confirm & Request Session
                </Button>
              </>
            )}
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CounselorProfile;
