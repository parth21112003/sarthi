import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={isDark ? 'Switch to Bright Mode' : 'Switch to Black Dark Mode'}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-slider">
        {isDark ? (
          <Moon size={16} className="theme-toggle-icon moon-icon" />
        ) : (
          <Sun size={16} className="theme-toggle-icon sun-icon" />
        )}
      </span>
      <span className="theme-toggle-label desktop-text">
        {isDark ? 'Bright' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;
