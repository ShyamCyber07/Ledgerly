import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  FileText,
  Settings,
  Landmark,
  X,
  Sparkles,
} from 'lucide-react';
import './Sidebar.css';
import { APP_NAME, APP_TAGLINE } from '../utils/constants';

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Landmark size={24} color="#15966A" strokeWidth={2.2} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">{APP_NAME}</h1>
            <span className="brand-subtitle">{APP_TAGLINE}</span>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-title">MAIN MENU</div>
          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                    onClick={() => {
                      if (window.innerWidth < 1024 && onClose) {
                        onClose();
                      }
                    }}
                  >
                    <Icon size={20} className="sidebar-icon" strokeWidth={1.9} />
                    <span className="sidebar-link-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Feature Card */}
        <div className="sidebar-footer-card">
          <div className="footer-card-header">
            <div className="footer-icon-badge">
              <Sparkles size={16} color="#15966A" />
            </div>
            <span className="footer-card-tag">Smart Tracking</span>
          </div>
          <h4 className="footer-card-title">INR Precision</h4>
          <p className="footer-card-desc">Real-time local ledger keeping your financial health sharp and on budget.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

