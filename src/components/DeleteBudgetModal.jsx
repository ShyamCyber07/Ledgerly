import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { formatINR } from '../utils/formatters';
import './DeleteConfirmModal.css';

export const DeleteBudgetModal = ({ isOpen, onClose, onConfirm, budget }) => {
  if (!isOpen || !budget) return null;

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
          <h3 className="delete-modal-title">Delete Category Budget?</h3>
          <p className="delete-modal-desc">
            Are you sure you want to delete the budget allocation for <strong>{budget.categoryName}</strong> for month <strong>{budget.month}</strong>?
            This will immediately remove progress tracking and recalculate your overall budget envelopes.
          </p>

          <div className="delete-tx-summary-card">
            <div className="delete-tx-row">
              <span className="summary-label">Category Envelope</span>
              <strong className="summary-val">{budget.categoryName}</strong>
            </div>
            <div className="delete-tx-row">
              <span className="summary-label">Allocated Limit</span>
              <strong className="text-expense">{formatINR(budget.limit || budget.allocated)}</strong>
            </div>
            <div className="delete-tx-row">
              <span className="summary-label">Target Month</span>
              <span className="summary-val">{budget.month}</span>
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
              onConfirm(budget.id);
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>Delete Budget</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBudgetModal;

