import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Calendar, Edit3, Plus, User, Clock, FileText } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import sessionNoteService from '../services/sessionNoteService';
import meetingService from '../services/meetingService';
import './Phase2.css';

const SessionNotes = () => {
  const { user } = useAuth();
  const isCounselor = user?.role === 'counselor';

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedMeetings, setCompletedMeetings] = useState([]);

  // Modal for creating/editing note
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isCounselor) {
        const [notesRes, meetingsRes] = await Promise.all([
          sessionNoteService.listMine(),
          meetingService.listMine(),
        ]);
        setNotes(notesRes.notes || []);
        // Filter completed meetings
        const completed = (meetingsRes.meetings || []).filter(
          (m) => m.status === 'completed'
        );
        setCompletedMeetings(completed);
      } else {
        const notesRes = await sessionNoteService.listStudent();
        setNotes(notesRes.notes || []);
      }
    } catch (err) {
      toast.error('Failed to load session notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isCounselor]);

  const handleOpenCreate = (meeting) => {
    setSelectedMeeting(meeting);
    setEditingNoteId(null);
    setNoteContent('');
    setNoteModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setSelectedMeeting(note.meeting);
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      if (editingNoteId) {
        await sessionNoteService.update(editingNoteId, noteContent);
        toast.success('Session note updated');
      } else {
        await sessionNoteService.create(selectedMeeting.id, noteContent);
        toast.success('Session note saved');
      }
      setNoteModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  // Check which completed meetings still need a note
  const meetingsWithoutNotes = completedMeetings.filter(
    (m) => !notes.some((n) => n.meetingId === m.id)
  );

  return (
    <DashboardLayout title="Session Notes & Feedback">
      <div className="page-stack">
        {loading ? (
          <div className="flex-center" style={{ minHeight: 300 }}>
            <Spinner text="Loading session documentation..." />
          </div>
        ) : (
          <>
            {/* Counselor Section: Meetings Awaiting Notes */}
            {isCounselor && meetingsWithoutNotes.length > 0 && (
              <Card>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Edit3 size={18} color="var(--accent-amber)" /> Completed Sessions Awaiting Notes ({meetingsWithoutNotes.length})
                  </h3>
                  <p className="muted small-text">
                    Add takeaways, action items, and recommended roadmaps for your students.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
                  {meetingsWithoutNotes.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px dashed var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <div>
                        <strong>{m.student?.name}</strong>
                        <div className="muted small-text" style={{ marginTop: '2px' }}>
                          {m.topic || 'General Career Consultation'}
                        </div>
                        <div className="muted small-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Calendar size={13} /> {m.date} | <Clock size={13} /> {m.startTime}
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleOpenCreate(m)}>
                        <Plus size={14} /> Add Notes
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Main Notes List */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3>{isCounselor ? 'Recorded Session Notes' : 'Guidance from Your Counselors'}</h3>
                  <p className="muted small-text">
                    {isCounselor
                      ? 'Detailed records and recommendations you have shared with students.'
                      : 'Review personalized action items and advice provided during your completed sessions.'}
                  </p>
                </div>
              </div>

              {notes.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={32} />}
                  title="No session notes recorded yet"
                  description={
                    isCounselor
                      ? 'Once sessions are completed, record your feedback and next steps here.'
                      : 'Notes and action items from your completed counseling sessions will appear here.'
                  }
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                          paddingBottom: 'var(--space-3)',
                          marginBottom: 'var(--space-3)',
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <FileText size={18} color="var(--primary-light)" />
                            {note.meeting?.topic || 'Counseling Session'}
                          </h4>
                          <div className="muted small-text" style={{ display: 'flex', gap: 'var(--space-4)', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={13} />
                              {isCounselor ? `Student: ${note.meeting?.student?.name}` : `Counselor: ${note.author?.name}`}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} /> {note.meeting?.date}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> {note.meeting?.startTime} - {note.meeting?.endTime}
                            </span>
                          </div>
                        </div>

                        {isCounselor && (
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(note)}>
                            <Edit3 size={14} /> Edit
                          </Button>
                        )}
                      </div>

                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.6',
                          fontSize: 'var(--text-sm)',
                          color: '#e2e8f0',
                        }}
                      >
                        {note.content}
                      </div>

                      <div className="muted small-text" style={{ marginTop: 'var(--space-3)', fontSize: '0.75rem' }}>
                        Last updated: {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Modal for Creating / Editing Session Note */}
        <Modal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          title={editingNoteId ? 'Edit Session Note' : 'Document Session Guidance'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {selectedMeeting && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div><strong>Student:</strong> {selectedMeeting.student?.name}</div>
                <div><strong>Session Topic:</strong> {selectedMeeting.topic || 'General Consultation'}</div>
                <div><strong>Date & Time:</strong> {selectedMeeting.date} ({selectedMeeting.startTime} - {selectedMeeting.endTime})</div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Counselor Feedback & Action Items
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Detail the topics discussed, recommended career streams, learning resources, and specific action items for the student..."
                rows={7}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--text-sm)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button variant="ghost" onClick={() => setNoteModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveNote} loading={saving}>
                {editingNoteId ? 'Update Note' : 'Save & Share with Student'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SessionNotes;
