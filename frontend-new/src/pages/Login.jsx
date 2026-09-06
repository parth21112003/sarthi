import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Login successful!');
      navigate(`/${data.user.role}/dashboard`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed. Please try again.');
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
          <h1>Welcome Back</h1>
          <p>Continue your journey with Sarthi. Log in to access your dashboard, sessions, and insights.</p>
        </div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      
      <div className="auth-form-container">
        <Card className="auth-card" padding="lg">
          <h2 className="auth-title">Log in to your account</h2>
          <p className="auth-subtitle">Enter your credentials to access your account</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <Input 
              label="Email" 
              type="email" 
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button 
              type="submit" 
              className="w-full mt-4" 
              size="lg" 
              isLoading={isLoading}
              iconRight={<ArrowRight size={18} />}
            >
              Log In
            </Button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
