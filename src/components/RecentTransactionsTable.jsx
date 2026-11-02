import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  CreditCard,
  Trash2,
  Receipt,
  Plus,
} from 'lucide-react';
import { formatINR, formatRelativeDate } from '../utils/formatters';
import './RecentTransactionsTable.css';

export const RecentTransactionsTable = ({
  transactions = [],
  onDelete,
  onOpenAddModal,
}) => {
  const [filter, setFilter] = useState('all');

  const filtered = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const displayList = filtered.slice(0, 7);

  return (
    <div className="card recent-tx-card">
      <div className="recent-tx-header">
        <div>
          <h3 className="chart-card-title">Recent Transactions</h3>
          <p className="chart-card-subtitle">Latest account inflows and outflows</p>
        </div>

        <div className="recent-tx-actions">
          {/* Filter Pills */}
          <div className="filter-pill-group">
            <button
              className={`filter-pill-btn ${filter === 'all' ? 'filter-pill-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({transactions.length})
            </button>
            <button
              className={`filter-pill-btn ${filter === 'income' ? 'filter-pill-active' : ''}`}
              onClick={() => setFilter('income')}
            >
              Income
            </button>
            <button
              className={`filter-pill-btn ${filter === 'expense' ? 'filter-pill-active' : ''}`}
              onClick={() => setFilter('expense')}
            >
              Expenses
            </button>
          </div>

          <Link to="/transactions" className="view-all-link">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div className="tx-empty-state">
          <Receipt size={42} className="empty-state-icon" />
          <p className="empty-state-title">No Transactions Found</p>
          <p className="empty-state-desc">
            {filter === 'all'
              ? 'Your transaction register is currently empty. Record your first income or expense.'
              : `No ${filter} entries found for the selected filter.`}
          </p>
          {onOpenAddModal && (
            <button className="btn btn-accent empty-state-btn" onClick={onOpenAddModal}>
              <Plus size={16} />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      ) : (
        <div className="tx-list-container">
          {displayList.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id} className="tx-item-row">
                <div className="tx-left-col">
                  <div className={`tx-icon-wrap ${isIncome ? 'tx-icon-income' : 'tx-icon-expense'}`}>
                    {isIncome ? (
                      <ArrowDownLeft size={18} strokeWidth={2.4} />
                    ) : (
                      <ArrowUpRight size={18} strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="tx-info-block">
                    <span className="tx-desc-text" title={tx.title || tx.description}>
                      {tx.title || tx.description}
                    </span>
                    <div className="tx-meta-row">
                      <span className="tx-category-pill">{tx.category}</span>
                      <span className="tx-dot-separator">•</span>
                      <span className="tx-meta-detail">
                        <CreditCard size={12} /> {tx.paymentMethod || 'UPI'}
                      </span>
                      <span className="tx-dot-separator">•</span>
                      <span className="tx-meta-detail">
                        <Calendar size={12} /> {formatRelativeDate(tx.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tx-right-col">
                  <span className={`tx-amount-text ${isIncome ? 'tx-amount-income' : 'tx-amount-expense'}`}>
                    {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                  </span>
                  {onDelete && (
                    <button
                      className="tx-delete-btn"
                      onClick={() => onDelete(tx.id)}
                      title="Delete transaction"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
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

export default RecentTransactionsTable;

