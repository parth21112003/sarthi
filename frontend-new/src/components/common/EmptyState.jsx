import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrapper">
        {icon}
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
