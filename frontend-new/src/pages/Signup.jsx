import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, BookOpen, Briefcase, Phone, GraduationCap } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student', mobile: '',
    specialization: '', experience: '', bio: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Please fill all required fields');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate(`/${formData.role}/dashboard`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decorative">
        <div className="auth-brand">
          <Link to="/">
            <span className="logo-icon gradient-bg">S</span>
            <span className="logo-text text-xl ml-2">Sarthi</span>
          </Link>
        </div>
        <div className="auth-illustration">
          <h1>Join Sarthi</h1>
          <p>Create an account to start your journey. Connect with experts, discover your potential, and shape your future.</p>
        </div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      
      <div className="auth-form-container">
        <Card className="auth-card" padding="lg">
          <h2 className="auth-title">Create an account</h2>
          <p className="auth-subtitle">Join us as a student or counsellor</p>

          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}></div>
            {formData.role === 'counselor' && <div className={`progress-step ${step >= 3 ? 'active' : ''}`}></div>}
          </div>
          
          <form onSubmit={step === (formData.role === 'counselor' ? 3 : 2) ? handleSubmit : (e) => e.preventDefault()} className="auth-form">
            
            {step === 1 && (
              <>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} icon={<User size={18}/>} placeholder="John Doe" />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<Mail size={18}/>} placeholder="you@example.com" />
                <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} icon={<Lock size={18}/>} placeholder="••••••••" />
                <div className="form-actions">
                  <Button type="button" className="w-full" onClick={handleNext}>Next</Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="role-selection">
                  <div className={`role-card ${formData.role === 'student' ? 'selected' : ''}`} onClick={() => setFormData({...formData, role: 'student'})}>
                    <div className="role-icon"><GraduationCap size={24}/></div>
                    <span>Student</span>
                  </div>
                  <div className={`role-card ${formData.role === 'counselor' ? 'selected' : ''}`} onClick={() => setFormData({...formData, role: 'counselor'})}>
                    <div className="role-icon"><Briefcase size={24}/></div>
                    <span>Counsellor</span>
                  </div>
                </div>
                <Input label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleChange} icon={<Phone size={18}/>} placeholder="+1 234 567 890" />
                
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  {formData.role === 'counselor' ? (
                    <Button type="button" className="w-full" onClick={handleNext}>Next</Button>
                  ) : (
                    <Button type="submit" className="w-full" isLoading={isLoading}>Sign Up</Button>
                  )}
                </div>
              </>
            )}

            {step === 3 && formData.role === 'counselor' && (
              <>
                <Input label="Specialization/Stream" name="specialization" value={formData.specialization} onChange={handleChange} icon={<BookOpen size={18}/>} placeholder="e.g. Engineering, Arts" />
                <Input label="Years of Experience" name="experience" type="number" value={formData.experience} onChange={handleChange} icon={<Briefcase size={18}/>} placeholder="e.g. 5" />
                <Input label="Bio" name="bio" type="textarea" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
                
                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
                  <Button type="submit" className="w-full" isLoading={isLoading}>Complete Sign Up</Button>
                </div>
              </>
            )}

          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
