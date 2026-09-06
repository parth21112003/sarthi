import React from 'react';
import './Button.css';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  iconLeft,
  iconRight,
  disabled,
  className = '',
  ...props
}) => {
  const baseClass = `btn btn-${variant} btn-${size} ${className}`;
  
  return (
    <button 
      className={baseClass} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading && <Loader2 className="spinner-icon" size={18} />}
      {!isLoading && iconLeft && <span className="btn-icon left">{iconLeft}</span>}
      <span className="btn-content">{children}</span>
      {!isLoading && iconRight && <span className="btn-icon right">{iconRight}</span>}
    </button>
  );
};

export default Button;
