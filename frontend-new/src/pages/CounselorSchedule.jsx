import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import counselorService from '../services/counselorService';
import './Phase2.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const emptySlot = { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' };

const CounselorSchedule = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSlots = async () => {
      setLoading(true);
      try {
        const data = await counselorService.getAvailability(user.id);
        setSlots(data.slots?.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })) || []);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadSlots();
    }
  }, [user?.id]);

  const updateSlot = (index, field, value) => {
    setSlots(slots.map((slot, currentIndex) => (
      currentIndex === index ? { ...slot, [field]: field === 'dayOfWeek' ? Number(value) : value } : slot
    )));
  };

  const addSlot = () => {
    setSlots([...slots, emptySlot]);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveSlots = async () => {
    setSaving(true);
    try {
      const data = await counselorService.saveAvailability(slots);
      setSlots(data.slots.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
      toast.success('Availability saved');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Schedule">
      <Card>
        <div className="section-title-row">
          <div>
            <h3>Weekly Availability</h3>
            <p className="muted small-text">Students will use these slots while requesting meetings.</p>
          </div>
          <Button iconLeft={<Plus size={18} />} onClick={addSlot}>Add Slot</Button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: 260 }}>
            <Spinner text="Loading schedule" />
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            icon={<Plus size={28} />}
            title="No slots published"
            description="Add your first weekly slot so students know when you are available."
            action={<Button onClick={addSlot}>Add Slot</Button>}
          />
        ) : (
          <div className="slot-list">
            {slots.map((slot, index) => (
              <div className="slot-editor" key={`${slot.dayOfWeek}-${slot.startTime}-${index}`}>
                <select className="native-select" value={slot.dayOfWeek} onChange={(event) => updateSlot(index, 'dayOfWeek', event.target.value)}>
                  {dayNames.map((day, dayIndex) => (
                    <option key={day} value={dayIndex}>{day}</option>
                  ))}
                </select>
                <input className="native-select" type="time" value={slot.startTime} onChange={(event) => updateSlot(index, 'startTime', event.target.value)} />
                <input className="native-select" type="time" value={slot.endTime} onChange={(event) => updateSlot(index, 'endTime', event.target.value)} />
                <Button variant="danger" iconLeft={<Trash2 size={16} />} onClick={() => removeSlot(index)}>Remove</Button>
              </div>
            ))}
          </div>
        )}

        <div className="section-title-row" style={{ marginTop: 'var(--space-6)', marginBottom: 0 }}>
          <span className="muted small-text">{slots.length} slot{slots.length === 1 ? '' : 's'} ready to save</span>
          <Button onClick={saveSlots} isLoading={saving}>Save Availability</Button>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default CounselorSchedule;
