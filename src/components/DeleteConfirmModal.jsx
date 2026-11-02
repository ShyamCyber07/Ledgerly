import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import './DeleteConfirmModal.css';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';

  return (
    <div className="delete-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="delete-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-alert-icon-box">
            <AlertTriangle size={24} />
          </div>
          <button className="delete-modal-close-btn" onClick={onClose} aria-label="Cancel">
            <X size={18} />
          </button>
        </div>

        <div className="delete-modal-content">
          <h3 className="delete-modal-title">Delete Transaction?</h3>
          <p className="delete-modal-desc">
            Are you sure you want to permanently delete this transaction from your ledger?
            This will immediately update your overall balance, monthly figures, and category budgets.
          </p>

          <div className="delete-tx-summary-card">
            <div className="delete-tx-row">
              <span className="summary-label">Title / Merchant</span>
              <strong className="summary-val">{transaction.title || transaction.description}</strong>
            </div>
            <div className="delete-tx-row">
              <span className="summary-label">Amount</span>
              <strong className={isIncome ? 'text-income' : 'text-expense'}>
                {isIncome ? '+' : '-'}{formatINR(transaction.amount)}
              </strong>
            </div>
            <div className="delete-tx-row">
              <span className="summary-label">Category & Date</span>
              <span className="summary-val">
                {transaction.category} • {formatDate(transaction.date)}
              </span>
            </div>
          </div>
        </div>

        <div className="delete-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger-action"
            onClick={() => {
              onConfirm(transaction.id);
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

