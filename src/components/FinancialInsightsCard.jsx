import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import './FinancialInsightsCard.css';

const insightIcons = {
  success: ShieldCheck,
  warning: AlertTriangle,
  danger: AlertTriangle,
  info: TrendingUp,
  neutral: Zap,
};

export const FinancialInsightsCard = ({ insights = [] }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="card insights-card">
        <div className="insights-header">
          <div className="insights-title-group">
            <Sparkles size={18} className="insights-sparkle" />
            <h3 className="chart-card-title">Financial Intelligence</h3>
          </div>
        </div>
        <div className="insights-empty-notice">
          Record a few more transactions across categories to unlock automated financial health insights and spending alerts.
        </div>
      </div>
    );
  }

  return (
    <div className="card insights-card">
      <div className="insights-header">
        <div className="insights-title-group">
          <div className="insights-badge-icon">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="chart-card-title">Financial Intelligence</h3>
            <p className="chart-card-subtitle">AI-driven analysis from your ledger</p>
          </div>
        </div>
        <span className="insights-live-pill">Live Analysis</span>
      </div>

      <div className="insights-list">
        {insights.map((item, idx) => {
          const Icon = insightIcons[item.type] || Zap;
          return (
            <div key={idx} className={`insight-item-row insight-${item.type}`}>
              <div className="insight-icon-box">
                <Icon size={18} strokeWidth={2.2} />
              </div>

              <div className="insight-content-box">
                <div className="insight-meta-line">
                  <h4 className="insight-headline">{item.title}</h4>
                  {item.badge && (
                    <span className={`insight-tag tag-${item.type}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="insight-body">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialInsightsCard;

