import React from 'react';
import './Card.css';

const Card = ({ children, variant = 'default', padding = 'md', className = '', hover = false }) => {
  const classes = `card card-${variant} padding-${padding} ${hover ? 'card-hover' : ''} ${className}`;
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card;
