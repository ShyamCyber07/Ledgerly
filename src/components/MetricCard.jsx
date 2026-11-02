import React from 'react';
import { formatINR } from '../utils/formatters';
import './MetricCard.css';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trend = null,
}) => {
  return (
    <div className={`metric-card-root metric-variant-${variant}`}>
      <div className="metric-top-row">
        <span className="metric-card-label">{label}</span>
        <div className={`metric-icon-badge metric-badge-${variant}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="metric-amount-row">
        <span className="metric-currency-value">{formatINR(value)}</span>
      </div>

      <div className="metric-bottom-row">
        {trend && (
          <span className={`metric-trend-tag trend-${trend.type}`}>
            {trend.text}
          </span>
        )}
        <span className="metric-subtext-label">{subtext}</span>
      </div>
    </div>
  );
};

export default MetricCard;

