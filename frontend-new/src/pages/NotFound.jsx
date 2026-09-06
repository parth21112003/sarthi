import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="not-found-content">
        <h1 className="error-code gradient-text">404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button size="lg">Go Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
