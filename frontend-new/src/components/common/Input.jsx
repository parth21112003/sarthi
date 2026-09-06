import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

const Input = ({ 
  label, 
  type = 'text', 
  error, 
  icon, 
  className = '', 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'input-error' : ''}`}>
        {icon && <span className="input-icon left">{icon}</span>}
        
        {type === 'textarea' ? (
          <textarea className="input-field textarea" {...props} />
        ) : (
          <input className="input-field" type={inputType} {...props} />
        )}

        {isPassword && (
          <button 
            type="button" 
            className="input-icon right toggle-pwd" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="error-msg">{error}</span>}
    </div>
  );
};

export default Input;
