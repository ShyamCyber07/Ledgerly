import React from 'react';
import { Menu, Plus, Search, IndianRupee, RotateCcw } from 'lucide-react';
import './Header.css';

export const Header = ({ onMenuClick, onOpenAddModal, onResetDemo, isDemoData, userName }) => {
  const displayName = userName || 'Priya Sharma';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PS';
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions, categories..."
            className="search-input"
            readOnly
            onClick={() => {
              // placeholder search feedback
            }}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="header-right">
        {/* Currency Pill */}
        <div className="currency-pill" title="Default Currency: Indian Rupee">
          <IndianRupee size={14} className="currency-icon" />
          <span>INR</span>
        </div>

        {/* Demo Data Quick Reset if active */}
        {isDemoData && (
          <button
            className="header-demo-reset-btn"
            onClick={onResetDemo}
            title="Reset to initial sample data"
          >
            <RotateCcw size={14} />
            <span className="reset-label">Reset Demo</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          className="btn btn-accent header-action-btn"
          onClick={onOpenAddModal}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Transaction</span>
        </button>

        {/* User Profile Pill */}
        <div className="user-profile-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-tier">Personal Vault</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
