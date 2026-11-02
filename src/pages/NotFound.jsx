import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import './PlaceholderPage.css';

export const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="card notfound-card">
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Page Not Found</h2>
        <p className="notfound-desc">
          The requested ledger view or financial module could not be found.
        </p>
        <Link to="/overview" className="btn btn-accent notfound-btn">
          <Home size={16} />
          <span>Return to Overview</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
