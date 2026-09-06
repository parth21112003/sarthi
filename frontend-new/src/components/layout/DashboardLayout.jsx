import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
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
            <NotificationBell />
            <Avatar name={user?.name} size="sm" isOnline={true} />
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
