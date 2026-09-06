import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Search, Calendar, MessageSquare, 
  Users, FileQuestion, User, LogOut, BookOpen, Compass
} from 'lucide-react';
import Avatar from '../common/Avatar';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  const studentLinks = [
    { name: 'Overview', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Find Counselors', path: '/student/counselors', icon: <Search size={20} /> },
    { name: 'My Meetings', path: '/student/meetings', icon: <Calendar size={20} /> },
    { name: 'Career Paths', path: '/student/career-paths', icon: <Compass size={20} /> },
    { name: 'Session Notes', path: '/student/session-notes', icon: <BookOpen size={20} /> },
    { name: 'Messages', path: '/student/messages', icon: <MessageSquare size={20} /> },
    { name: 'Community', path: '/student/community', icon: <Users size={20} /> },
    { name: 'Aptitude Test', path: '/student/aptitude', icon: <FileQuestion size={20} /> },
    { name: 'Profile', path: '/student/profile', icon: <User size={20} /> },
  ];

  const counselorLinks = [
    { name: 'Overview', path: '/counselor/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Schedule', path: '/counselor/schedule', icon: <Calendar size={20} /> },
    { name: 'Meetings', path: '/counselor/meetings', icon: <Users size={20} /> },
    { name: 'Session Notes', path: '/counselor/session-notes', icon: <BookOpen size={20} /> },
    { name: 'Messages', path: '/counselor/messages', icon: <MessageSquare size={20} /> },
    { name: 'Profile', path: '/counselor/profile', icon: <User size={20} /> },
  ];

  const links = user?.role === 'counselor' ? counselorLinks : studentLinks;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-header" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }} title="Go to Home">
          <span className="logo-icon gradient-bg">S</span>
          <span className="logo-text">Sarthi</span>
        </Link>

        <div className="sidebar-nav">
          {links.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.path}
              end={link.path.endsWith('dashboard')}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.name} size="sm" isOnline={true} />
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
