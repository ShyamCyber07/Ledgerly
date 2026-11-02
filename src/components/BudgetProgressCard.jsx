import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import './BudgetProgressCard.css';

export const BudgetProgressCard = ({ budgets = [] }) => {
  const hasBudgets = budgets && budgets.length > 0;

  return (
    <div className="card budget-progress-card">
      <div className="budget-card-header">
        <div>
          <h3 className="chart-card-title">Budget Adherence</h3>
          <p className="chart-card-subtitle">Monthly category allocation vs actuals</p>
        </div>
        <Link to="/budgets" className="view-all-link">
          <span>Manage</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {!hasBudgets ? (
        <div className="budget-empty-state">
          <Target size={38} className="empty-state-icon" />
          <p className="empty-state-title">No Budgets Configured</p>
          <p className="empty-state-desc">
            Set up monthly spending targets for categories like Groceries, Dining, and Fuel to stay on track.
          </p>
          <Link to="/budgets" className="btn btn-secondary empty-state-btn">
            Set Budget Limits
          </Link>
        </div>
      ) : (
        <div className="budget-items-list">
          {budgets.map((item) => {
            const isExceeded = item.warningStatus === 'exceeded' || item.isOverBudget;
            const isHighWarning = item.warningStatus === 'high_warning' || (!isExceeded && item.rawPercentUsed >= 90);
            const isWarning = item.warningStatus === 'warning' || (!isExceeded && !isHighWarning && item.rawPercentUsed >= 75);

            let statusClass = 'progress-normal';
            if (isExceeded) statusClass = 'progress-danger';
            else if (isHighWarning) statusClass = 'progress-high-warning';
            else if (isWarning) statusClass = 'progress-warning';

            return (
              <div key={item.id} className="budget-item-block">
                <div className="budget-item-label-row">
                  <div className="budget-category-info">
                    <span
                      className="budget-color-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="budget-cat-name">{item.categoryName}</span>
                  </div>

                  <div className="budget-amount-info">
                    <span className="budget-spent-val">{formatINR(item.spent)}</span>
                    <span className="budget-limit-val">of {formatINR(item.limit || item.allocated)}</span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="budget-progress-track">
                  <div
                    className={`budget-progress-fill ${statusClass}`}
                    style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                  />
                </div>

                <div className="budget-item-footer">
                  <span className="budget-pct-text">
                    {item.rawPercentUsed.toFixed(0)}% used
                  </span>

                  {isExceeded && (
                    <span className="budget-status-tag tag-danger">
                      <AlertCircle size={12} /> Over by {formatINR(item.spent - (item.limit || item.allocated))}
                    </span>
                  )}
                  {isHighWarning && (
                    <span className="budget-status-tag tag-high-warning">
                      <AlertCircle size={12} /> {formatINR(item.remaining)} left (90%+)
                    </span>
                  )}
                  {isWarning && (
                    <span className="budget-status-tag tag-warning">
                      <AlertCircle size={12} /> {formatINR(item.remaining)} left (75%+)
                    </span>
                  )}
                  {!isExceeded && !isHighWarning && !isWarning && (
                    <span className="budget-status-tag tag-success">
                      <CheckCircle2 size={12} /> {formatINR(item.remaining)} remaining
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetProgressCard;

