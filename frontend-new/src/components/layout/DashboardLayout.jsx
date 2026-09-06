import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import ThemeToggle from '../common/ThemeToggle';
import AiChatWidget from '../ai/AiChatWidget';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">{title}</h1>
          </div>
          
          <div className="header-right">
            <ThemeToggle />
            <NotificationBell />
            <Link to={`/${user?.role || 'student'}/profile`} className="header-user-profile" title="View Profile">
              <Avatar name={user?.name || user?.email} size="sm" isOnline={true} />
              <div className="header-user-info">
                <span className="header-user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
                <span className="header-user-role">{user?.role || 'Student'}</span>
              </div>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>

      {/* Floating 24/7 AI Career Companion */}
      <AiChatWidget />
    </div>
  );
};

export default DashboardLayout;
