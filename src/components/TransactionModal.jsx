import React, { useState } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Tag,
  Hash,
} from 'lucide-react';
import { STANDARD_CATEGORIES, PAYMENT_METHODS } from '../utils/constants';
import { getTodayDateString } from '../utils/formatters';
import './TransactionModal.css';

const TransactionModalForm = ({
  initialData,
  onClose,
  onSubmit,
  categories,
}) => {
  const isEditMode = Boolean(initialData && initialData.id);

  const [type, setType] = useState(() => initialData?.type || 'expense');
  const [title, setTitle] = useState(() => initialData?.title || initialData?.description || '');
  const [amount, setAmount] = useState(() => (initialData?.amount !== undefined ? String(initialData.amount) : ''));
  const [category, setCategory] = useState(() => initialData?.category || (initialData?.type === 'income' ? 'Salary' : 'Food'));
  const [paymentMethod, setPaymentMethod] = useState(() => initialData?.paymentMethod || 'UPI');
  const [date, setDate] = useState(() => (initialData?.date ? initialData.date.split('T')[0] : getTodayDateString()));
  const [notes, setNotes] = useState(() => initialData?.notes || '');
  const [errors, setErrors] = useState({});

  const availableCategories = categories && categories.length > 0
    ? categories
        .filter((c) => c.type === 'both' || c.type === type)
        .map((c) => c.name)
    : STANDARD_CATEGORIES;

  const handleValidate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title or merchant name is required.';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters long.';
    }

    const numericAmount = parseFloat(amount);
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required.';
    } else if (isNaN(numericAmount)) {
      newErrors.amount = 'Amount must be a valid number.';
    } else if (numericAmount <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0.00.';
    }

    if (!date) {
      newErrors.date = 'Date is required.';
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        newErrors.date = 'Please enter a valid date.';
      }
    }

    if (!category) {
      newErrors.category = 'Please choose a category.';
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please choose a payment method.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handleValidate()) {
      return;
    }

    const payload = {
      title: title.trim(),
      description: title.trim(),
      amount: parseFloat(amount),
      type,
      category,
      paymentMethod,
      date,
      notes: notes.trim(),
    };

    if (isEditMode && initialData.id) {
      payload.id = initialData.id;
    }

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="tx-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tx-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="tx-modal-header">
          <div>
            <div className="tx-modal-tag-row">
              <span className={`tx-modal-type-badge ${isEditMode ? 'badge-edit' : 'badge-new'}`}>
                {isEditMode ? 'EDIT MODE' : 'NEW ENTRY'}
              </span>
              {isEditMode && <span className="tx-modal-id-tag"><Hash size={11} /> {initialData.id}</span>}
            </div>
            <h3 className="tx-modal-title">
              {isEditMode ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="tx-modal-subtitle">
              {isEditMode
                ? 'Update ledger attributes and values'
                : 'Add a new verified entry to your personal INR ledger'}
            </p>
          </div>
          <button className="tx-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tx-modal-form" noValidate>
          {/* Income vs Expense Toggle */}
          <div className="tx-type-selector">
            <button
              type="button"
              className={`tx-type-btn ${type === 'expense' ? 'tx-type-btn-expense' : ''}`}
              onClick={() => {
                setType('expense');
                if (category === 'Salary' || category === 'Freelance') {
                  setCategory('Food');
                }
              }}
            >
              <ArrowUpRight size={17} />
              <span>Expense (Outflow)</span>
            </button>

            <button
              type="button"
              className={`tx-type-btn ${type === 'income' ? 'tx-type-btn-income' : ''}`}
              onClick={() => {
                setType('income');
                if (!['Salary', 'Freelance', 'Other'].includes(category)) {
                  setCategory('Salary');
                }
              }}
            >
              <ArrowDownLeft size={17} />
              <span>Income (Inflow)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="tx-form-field">
            <label className="tx-field-label">
              <span>Amount (INR ₹)</span>
              <span className="tx-required-mark">*</span>
            </label>
            <div className={`tx-amount-box ${errors.amount ? 'tx-input-error' : ''}`}>
              <span className="tx-currency-glyph">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
                }}
                className="tx-amount-input"
                autoFocus={!isEditMode}
              />
            </div>
            {errors.amount && (
              <span className="tx-field-error-message">
                <AlertCircle size={13} /> {errors.amount}
              </span>
            )}
          </div>

          {/* Title / Description */}
          <div className="tx-form-field">
            <label className="tx-field-label">
              <span>Title / Merchant</span>
              <span className="tx-required-mark">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy, Apartment Rent, Quarterly Bonus"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              className={`tx-text-input ${errors.title ? 'tx-input-error' : ''}`}
            />
            {errors.title && (
              <span className="tx-field-error-message">
                <AlertCircle size={13} /> {errors.title}
              </span>
            )}
          </div>

          {/* Category & Payment Method Row */}
          <div className="tx-form-two-col">
            <div className="tx-form-field">
              <label className="tx-field-label">
                <span className="flex items-center gap-1">
                  <Tag size={13} /> Category
                </span>
                <span className="tx-required-mark">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                }}
                className={`tx-select-input ${errors.category ? 'tx-input-error' : ''}`}
              >
                {availableCategories.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span className="tx-field-error-message">
                  <AlertCircle size={13} /> {errors.category}
                </span>
              )}
            </div>

            <div className="tx-form-field">
              <label className="tx-field-label">
                <span className="flex items-center gap-1">
                  <CreditCard size={13} /> Payment Method
                </span>
                <span className="tx-required-mark">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="tx-select-input"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="tx-form-field">
            <label className="tx-field-label">
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Date
              </span>
              <span className="tx-required-mark">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
              }}
              className={`tx-text-input ${errors.date ? 'tx-input-error' : ''}`}
            />
            {errors.date && (
              <span className="tx-field-error-message">
                <AlertCircle size={13} /> {errors.date}
              </span>
            )}
          </div>

          {/* Optional Notes */}
          <div className="tx-form-field">
            <label className="tx-field-label">
              <span className="flex items-center gap-1">
                <FileText size={13} /> Notes & Remarks
              </span>
              <span className="tx-optional-hint">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add supplementary context, invoice reference, or payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="tx-textarea-input"
            />
          </div>

          {/* Footer Actions */}
          <div className="tx-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent tx-save-btn">
              <Check size={18} strokeWidth={2.4} />
              <span>{isEditMode ? 'Update Transaction' : 'Save to Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  categories = [],
}) => {
  if (!isOpen) return null;

  return (
    <TransactionModalForm
      key={initialData?.id || 'new-tx'}
      initialData={initialData}
      onClose={onClose}
      onSubmit={onSubmit}
      categories={categories}
    />
  );
};

export default TransactionModal;
