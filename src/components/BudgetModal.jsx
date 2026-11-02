import React, { useState } from 'react';
import { X, Check, AlertCircle, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { STANDARD_CATEGORIES } from '../utils/constants';
import './BudgetModal.css';

const BudgetModalForm = ({
  initialData,
  defaultMonth,
  existingBudgets = [],
  onClose,
  onSubmit,
  categories = [],
}) => {
  const isEditMode = Boolean(initialData && initialData.id);

  const [categoryName, setCategoryName] = useState(() => initialData?.categoryName || 'Food');
  const [limit, setLimit] = useState(() => (initialData?.limit !== undefined ? String(initialData.limit) : ''));
  const [month, setMonth] = useState(() => initialData?.month || defaultMonth);
  const [error, setError] = useState('');

  // Available categories: filter out income-only categories if needed, or use STANDARD_CATEGORIES
  const selectableCategories = categories && categories.length > 0
    ? categories.filter((c) => c.type !== 'income').map((c) => c.name)
    : STANDARD_CATEGORIES.filter((c) => c !== 'Salary' && c !== 'Freelance');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate Category
    if (!categoryName) {
      setError('Please select a category for this budget envelope.');
      return;
    }

    // 2. Validate Amount > 0
    const numLimit = parseFloat(limit);
    if (!limit || limit.trim() === '') {
      setError('Allocated budget amount is required.');
      return;
    }
    if (isNaN(numLimit) || numLimit <= 0) {
      setError('Allocated amount must be a positive number greater than ₹0.');
      return;
    }

    // 3. Validate Month
    if (!month || month.length !== 7) {
      setError('Please select a valid month (YYYY-MM).');
      return;
    }

    // 4. Duplicate Check: Prevent duplicate category budgets for the same month
    const duplicate = existingBudgets.find((b) => {
      if (isEditMode && b.id === initialData.id) return false;
      return (
        b.categoryName.toLowerCase() === categoryName.toLowerCase() &&
        (b.month === month || (!b.month && month === defaultMonth))
      );
    });

    if (duplicate) {
      setError(
        `A budget for "${categoryName}" already exists for ${month}. Please choose a different category or edit the existing budget.`
      );
      return;
    }

    // Category Color lookup
    const catObj = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    const color = catObj?.color || '#15966A';

    const payload = {
      categoryName,
      limit: numLimit,
      month,
      color,
    };

    if (isEditMode && initialData.id) {
      payload.id = initialData.id;
    }

    try {
      onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget.');
    }
  };

  return (
    <div className="budget-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="budget-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="budget-modal-header">
          <div>
            <span className={`budget-modal-badge ${isEditMode ? 'badge-edit' : 'badge-new'}`}>
              {isEditMode ? 'EDIT BUDGET' : 'NEW ALLOCATION'}
            </span>
            <h3 className="budget-modal-title">
              {isEditMode ? `Edit ${initialData.categoryName} Budget` : 'Set Category Budget'}
            </h3>
            <p className="budget-modal-subtitle">
              {isEditMode
                ? 'Update monthly spending limits and envelope targets'
                : 'Define monthly expenditure cap to trigger progressive warnings'}
            </p>
          </div>
          <button className="budget-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="budget-modal-error">
            <AlertCircle size={16} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="budget-modal-form" noValidate>
          {/* Category Dropdown */}
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1">
                <Tag size={13} /> Target Category
              </span>
              <span className="tx-required-mark">*</span>
            </label>
            <select
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError('');
              }}
              className="form-select"
            >
              {selectableCategories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Limit in INR */}
          <div className="form-group">
            <label className="form-label">
              <span>Monthly Allocation Limit (INR ₹)</span>
              <span className="tx-required-mark">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="0.00"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  setError('');
                }}
                className="form-input amount-input"
                autoFocus={!isEditMode}
              />
            </div>
          </div>

          {/* Target Month */}
          <div className="form-group">
            <label className="form-label">
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Fiscal Month
              </span>
              <span className="tx-required-mark">*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setError('');
              }}
              className="form-input"
              required
            />
          </div>

          {/* Threshold Explanation Note */}
          <div className="budget-threshold-info">
            <div className="flex items-center gap-1 threshold-header">
              <ShieldCheck size={14} color="#15966A" />
              <strong>Automated Alert Triggers</strong>
            </div>
            <p className="threshold-text">
              Ledgerly dynamically surfaces warnings when actual expenses reach <strong>75% (Warning)</strong>, <strong>90% (High Warning)</strong>, and <strong>100%+ (Exceeded)</strong>.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent modal-submit-btn">
              <Check size={18} strokeWidth={2.4} />
              <span>{isEditMode ? 'Update Budget' : 'Save Allocation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultMonth,
  existingBudgets = [],
  categories = [],
}) => {
  if (!isOpen) return null;

  return (
    <BudgetModalForm
      key={initialData?.id || 'new-budget'}
      initialData={initialData}
      defaultMonth={defaultMonth}
      existingBudgets={existingBudgets}
      onClose={onClose}
      onSubmit={onSubmit}
      categories={categories}
    />
  );
};

export default BudgetModal;

