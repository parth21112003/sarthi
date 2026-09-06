import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon gradient-bg">S</span>
          <span className="logo-text">Sarthi</span>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-links desktop-only">
          {!isAuthenticated ? (
            <>
              <Link to="/#features" className="nav-link">Features</Link>
            </>
          ) : (
            <Link to={`/${user?.role}/dashboard`} className="nav-link">Dashboard</Link>
          )}
        </div>

        <div className="nav-actions desktop-only">
          {!isAuthenticated ? (
            <>
              <Link to="/login"><Button variant="ghost">Login</Button></Link>
              <Link to="/signup"><Button variant="primary">Sign Up</Button></Link>
            </>
          ) : (
            <div className="user-menu">
              <Link to={`/${user?.role || 'student'}/profile`} className="user-profile-link" title="View Profile">
                <Avatar name={user?.name || user?.email} size="sm" isOnline={true} />
                <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="mobile-toggle mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu slideDown">
          {!isAuthenticated ? (
            <>
              <Link to="/#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}><Button variant="ghost" className="w-full">Login</Button></Link>
              <Link to="/signup" onClick={() => setMobileMenuOpen(false)}><Button variant="primary" className="w-full">Sign Up</Button></Link>
            </>
          ) : (
            <>
              <Link to={`/${user?.role}/profile`} className="mobile-user" onClick={() => setMobileMenuOpen(false)}>
                <Avatar name={user?.name} size="sm" isOnline={true} />
                <span>{user?.name}</span>
              </Link>
              <Link to={`/${user?.role}/dashboard`} className="nav-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Button variant="ghost" iconLeft={<LogOut size={18} />} onClick={handleLogout} className="w-full justify-start">Logout</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
