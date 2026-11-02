import React, { useState } from 'react';
import { RotateCcw, Trash2, X, Sparkles } from 'lucide-react';
import './DemoDataBanner.css';

export const DemoDataBanner = ({ onReset, onClear, isDemoData }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !isDemoData) return null;

  return (
    <div className="demo-banner">
      <div className="demo-banner-content">
        <div className="demo-banner-icon-wrap">
          <Sparkles size={18} className="demo-sparkle-icon" />
        </div>
        <div className="demo-banner-text">
          <div className="demo-banner-title-row">
            <span className="demo-badge">SAMPLE DATASET (INR ₹)</span>
            <span className="demo-title">Exploring Ledgerly in Demo Mode</span>
          </div>
          <p className="demo-desc">
            All calculations are live using the centralized storage service with realistic Indian Rupee figures. You can add entries, reset anytime, or clear to test empty states.
          </p>
        </div>
      </div>

      <div className="demo-banner-actions">
        <button
          className="btn btn-secondary demo-action-btn"
          onClick={onReset}
          title="Re-populate initial sample records"
        >
          <RotateCcw size={14} />
          <span>Reset Demo</span>
        </button>
        <button
          className="btn btn-secondary demo-action-btn demo-clear-btn"
          onClick={onClear}
          title="Clear all transactions and budgets to preview zero-state"
        >
          <Trash2 size={14} />
          <span>Clear Data</span>
        </button>
        <button
          className="demo-close-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default DemoDataBanner;
