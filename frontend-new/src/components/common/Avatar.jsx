import React from 'react';
import './Avatar.css';

const Avatar = ({ src, name, size = 'md', isOnline }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  return (
    <div className={`avatar-container avatar-${size}`}>
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <div className="avatar-initials gradient-bg">{initials}</div>
      )}
      {isOnline !== undefined && (
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
      )}
    </div>
  );
};

export default Avatar;
