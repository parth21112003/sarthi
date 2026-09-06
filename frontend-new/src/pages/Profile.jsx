import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Mail, Phone, User } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import './Phase2.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gender: '',
    stream: '',
    bio: '',
    specialization: '',
    experience: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        mobile: user.mobile || '',
        gender: user.gender || '',
        stream: user.stream || '',
        bio: user.bio || '',
        specialization: user.specialization || '',
        experience: user.experience ?? '',
      });
    }
  }, [user]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...formData,
        experience: formData.experience === '' ? undefined : Number(formData.experience),
      });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Profile">
      <Card className="profile-card">
        <form className="page-stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={<User size={18} />} />
            <Input label="Email" value={user?.email || ''} disabled icon={<Mail size={18} />} />
            <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleChange} icon={<Phone size={18} />} />
            <Input label="Stream" name="stream" value={formData.stream} onChange={handleChange} placeholder="Science, Commerce, Arts..." />
            <label className="input-wrapper">
              <span className="input-label">Gender</span>
              <select className="native-select" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </label>
            {user?.role === 'counselor' && (
              <Input label="Experience" name="experience" type="number" value={formData.experience} onChange={handleChange} icon={<Briefcase size={18} />} />
            )}
            {user?.role === 'counselor' && (
              <Input className="full" label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Engineering, medical, design..." />
            )}
            <Input className="full" label="Bio" name="bio" type="textarea" value={formData.bio} onChange={handleChange} placeholder="Tell students what kind of guidance you need or provide." />
          </div>
          <Button type="submit" isLoading={saving}>Save Profile</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
};

export default Profile;
