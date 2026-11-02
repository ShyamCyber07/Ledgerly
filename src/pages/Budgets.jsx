import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import BudgetModal from '../components/BudgetModal';
import DeleteBudgetModal from '../components/DeleteBudgetModal';
import { formatINR, getMonthName } from '../utils/formatters';
import './Budgets.css';

const formatMonthLabel = (monthKey, activeMonthKey) => {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10) - 1;
  const label = `${getMonthName(monthNum)} ${yearStr}`;
  return monthKey === activeMonthKey ? `${label} (Current)` : label;
};

export const Budgets = () => {
  const {
    budgets,
    categories,
    activeMonthKey,
    availableBudgetMonths,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetProgressForMonth,
    getBudgetSummaryForMonth,
  } = useLedgerData();

  // Selected Month State (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(() => activeMonthKey);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'exceeded' | 'warning' | 'healthy'

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudget, setDeletingBudget] = useState(null);

  // Month options list (sorted descending)
  const monthOptions = useMemo(() => {
    const list = availableBudgetMonths && availableBudgetMonths.length > 0
      ? availableBudgetMonths
      : [activeMonthKey];
    if (!list.includes(selectedMonth)) {
      return [selectedMonth, ...list].sort((a, b) => b.localeCompare(a));
    }
    return list;
  }, [availableBudgetMonths, activeMonthKey, selectedMonth]);

  // Dynamic calculations for selected month (strictly from expense transactions in selected month)
  const categoryProgress = useMemo(() => {
    return getBudgetProgressForMonth(selectedMonth);
  }, [getBudgetProgressForMonth, selectedMonth]);

  const summary = useMemo(() => {
    return getBudgetSummaryForMonth(selectedMonth);
  }, [getBudgetSummaryForMonth, selectedMonth]);

  // Filter category cards by status
  const filteredCategoryBudgets = useMemo(() => {
    return categoryProgress.filter((item) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'exceeded') return item.warningStatus === 'exceeded';
      if (statusFilter === 'warning') {
        return item.warningStatus === 'warning' || item.warningStatus === 'high_warning';
      }
      if (statusFilter === 'healthy') return item.warningStatus === 'normal';
      return true;
    });
  }, [categoryProgress, statusFilter]);

  // Copy budgets from previous month helper
  const handleCopyPreviousBudgets = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let prevYear = parseInt(yearStr, 10);
    let prevMonth = parseInt(monthStr, 10) - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const prevBudgets = budgets.filter((b) => b.month === prevMonthKey);

    if (prevBudgets.length === 0) {
      alert(`No budgets found in preceding month (${formatMonthLabel(prevMonthKey, activeMonthKey)}) to copy.`);
      return;
    }

    let addedCount = 0;
    prevBudgets.forEach((pb) => {
      try {
        addBudget({
          categoryName: pb.categoryName,
          limit: pb.limit,
          month: selectedMonth,
          color: pb.color,
        });
        addedCount++;
      } catch {
        // Skip duplicate or existing category budget for target month
      }
    });

    if (addedCount > 0) {
      alert(`Successfully copied ${addedCount} budget allocations to ${formatMonthLabel(selectedMonth, activeMonthKey)}!`);
    } else {
      alert('All budget categories from the previous month already exist for this month.');
    }
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleModalSubmit = (payload) => {
    if (editingBudget && editingBudget.id) {
      updateBudget(editingBudget.id, payload);
    } else {
      addBudget(payload);
    }
    setModalOpen(false);
    setEditingBudget(null);
  };

  const handleOpenDelete = (budget) => {
    setDeletingBudget(budget);
  };

  const handleConfirmDelete = (id) => {
    deleteBudget(id);
    setDeletingBudget(null);
  };

  return (
    <div className="budgets-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Budgets & Allocations</h2>
          <p className="page-subtitle">
            Configure monthly expenditure envelopes with multi-tier warning thresholds (75%, 90%, 100%)
          </p>
        </div>

        <div className="budgets-header-actions">
          {/* Monthly Selection Dropdown */}
          <div className="budget-month-selector-box">
            <Calendar size={15} className="month-icon" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="budget-month-select"
              aria-label="Select budget month"
            >
              {monthOptions.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey, activeMonthKey)}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-accent" onClick={handleOpenAdd}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* Total Monthly Budget KPI Dashboard Card */}
      <div className="card budget-overall-card">
        <div className="overall-top-row">
          <div>
            <span className="overall-month-tag">
              {formatMonthLabel(selectedMonth, activeMonthKey)} Envelope
            </span>
            <h3 className="overall-title">Total Monthly Budget Status</h3>
          </div>

          <div className="overall-warning-badges">
            {summary.exceededCount > 0 && (
              <span className="badge badge-expense">
                <ShieldAlert size={12} /> {summary.exceededCount} Exceeded
              </span>
            )}
            {summary.highWarningCount > 0 && (
              <span className="badge badge-warning-high">
                <AlertTriangle size={12} /> {summary.highWarningCount} High Warning (90%+)
              </span>
            )}
            {summary.warningCount > 0 && (
              <span className="badge badge-warning-mid">
                <AlertCircle size={12} /> {summary.warningCount} Warning (75%+)
              </span>
            )}
            {summary.exceededCount === 0 && summary.highWarningCount === 0 && summary.warningCount === 0 && summary.totalCategories > 0 && (
              <span className="badge badge-income">
                <CheckCircle2 size={12} /> All Categories Healthy
              </span>
            )}
          </div>
        </div>

        <div className="overall-figures-grid">
          <div className="overall-stat-block">
            <span className="overall-stat-label">Allocated Amount</span>
            <div className="overall-stat-val">{formatINR(summary.totalAllocated)}</div>
            <span className="overall-stat-caption">
              Total cap across {summary.totalCategories} active envelopes
            </span>
          </div>

          <div className="overall-stat-block">
            <span className="overall-stat-label">Actual Expenses</span>
            <div className="overall-stat-val text-expense">
              {formatINR(summary.totalSpent)}
            </div>
            <span className="overall-stat-caption">Calculated from outflow transactions</span>
          </div>

          <div className="overall-stat-block">
            <span className="overall-stat-label">Remaining Headroom</span>
            <div
              className="overall-stat-val"
              style={{
                color: summary.totalRemaining > 0 ? 'var(--accent)' : 'var(--expense)',
              }}
            >
              {formatINR(summary.totalRemaining)}
            </div>
            <span className="overall-stat-caption">Discretionary capital available</span>
          </div>

          <div className="overall-stat-block">
            <span className="overall-stat-label">Percentage Spent</span>
            <div className="overall-stat-val">
              {summary.percentSpent.toFixed(1)}%
            </div>
            <span className="overall-stat-caption">Overall monthly burn velocity</span>
          </div>
        </div>

        {/* Total Overall Progress Track */}
        <div className="overall-progress-bar-wrap">
          <div className="overall-track">
            <div
              className={`overall-fill ${
                summary.percentSpent >= 100
                  ? 'progress-danger'
                  : summary.percentSpent >= 90
                  ? 'progress-high-warning'
                  : summary.percentSpent >= 75
                  ? 'progress-warning'
                  : 'progress-normal'
              }`}
              style={{ width: `${Math.min(summary.percentSpent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budget Section Header with Status Tabs */}
      <div className="budget-section-bar">
        <div className="status-tabs-group">
          <button
            className={`status-tab-btn ${statusFilter === 'all' ? 'status-tab-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Budgets ({categoryProgress.length})
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'exceeded' ? 'status-tab-active' : ''}`}
            onClick={() => setStatusFilter('exceeded')}
          >
            Exceeded ({summary.exceededCount})
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'warning' ? 'status-tab-active' : ''}`}
            onClick={() => setStatusFilter('warning')}
          >
            Warnings ({summary.warningCount + summary.highWarningCount})
          </button>
          <button
            className={`status-tab-btn ${statusFilter === 'healthy' ? 'status-tab-active' : ''}`}
            onClick={() => setStatusFilter('healthy')}
          >
            Healthy ({summary.normalCount})
          </button>
        </div>

        {categoryProgress.length === 0 && (
          <button
            className="btn btn-secondary copy-previous-btn"
            onClick={handleCopyPreviousBudgets}
            title="Duplicate allocations from preceding month"
          >
            <Copy size={14} />
            <span>Copy From Previous Month</span>
          </button>
        )}
      </div>

      {/* Grid of Category-Wise Budgets */}
      {filteredCategoryBudgets.length === 0 ? (
        <div className="card budget-empty-card">
          <Target size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Category Budgets Found</h3>
          <p className="empty-state-desc">
            {statusFilter !== 'all'
              ? `No category envelopes match the "${statusFilter}" filter criteria for ${formatMonthLabel(selectedMonth, activeMonthKey)}.`
              : `No spending targets have been configured for ${formatMonthLabel(selectedMonth, activeMonthKey)}.`}
          </p>
          <div className="flex gap-2 items-center empty-actions-row">
            <button className="btn btn-accent" onClick={handleOpenAdd}>
              <Plus size={16} />
              <span>Set First Category Budget</span>
            </button>
            <button className="btn btn-secondary" onClick={handleCopyPreviousBudgets}>
              <Copy size={14} />
              <span>Copy Preceding Month</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="category-budgets-grid">
          {filteredCategoryBudgets.map((item) => {
            const isExceeded = item.warningStatus === 'exceeded';
            const isHighWarning = item.warningStatus === 'high_warning';
            const isWarning = item.warningStatus === 'warning';

            return (
              <div key={item.id} className="card budget-envelope-card">
                {/* Envelope Top Line */}
                <div className="envelope-top-line">
                  <div className="envelope-category-info">
                    <span
                      className="envelope-color-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <h4 className="envelope-category-name">{item.categoryName}</h4>
                  </div>

                  {/* Warning Pill */}
                  {isExceeded && (
                    <span className="badge badge-expense">
                      <ShieldAlert size={12} /> Exceeded ({item.rawPercentUsed.toFixed(0)}%)
                    </span>
                  )}
                  {isHighWarning && (
                    <span className="badge badge-warning-high">
                      <AlertTriangle size={12} /> High Warning ({item.rawPercentUsed.toFixed(0)}%)
                    </span>
                  )}
                  {isWarning && (
                    <span className="badge badge-warning-mid">
                      <AlertCircle size={12} /> Warning ({item.rawPercentUsed.toFixed(0)}%)
                    </span>
                  )}
                  {!isExceeded && !isHighWarning && !isWarning && (
                    <span className="badge badge-income">
                      <CheckCircle2 size={12} /> Healthy ({item.rawPercentUsed.toFixed(0)}%)
                    </span>
                  )}
                </div>

                {/* Key Figures: Allocated, Actual, Remaining */}
                <div className="envelope-figures-row">
                  <div className="figure-item">
                    <span className="figure-label">Allocated</span>
                    <strong className="figure-value">{formatINR(item.allocated)}</strong>
                  </div>

                  <div className="figure-item">
                    <span className="figure-label">Actual Expenses</span>
                    <strong className="figure-value text-expense">{formatINR(item.spent)}</strong>
                  </div>

                  <div className="figure-item text-right">
                    <span className="figure-label">
                      {isExceeded ? 'Exceeded By' : 'Remaining'}
                    </span>
                    <strong
                      className={`figure-value ${isExceeded ? 'text-expense' : 'text-income'}`}
                    >
                      {isExceeded
                        ? `+${formatINR(item.exceededAmount)}`
                        : formatINR(item.remaining)}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar with multi-tier warnings */}
                <div className="envelope-progress-track">
                  <div
                    className={`envelope-progress-fill ${
                      isExceeded
                        ? 'progress-danger'
                        : isHighWarning
                        ? 'progress-high-warning'
                        : isWarning
                        ? 'progress-warning'
                        : 'progress-normal'
                    }`}
                    style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                  />
                </div>

                {/* Envelope Footer Info & Actions */}
                <div className="envelope-footer-line">
                  <span className="envelope-pct-note">
                    <strong>{item.rawPercentUsed.toFixed(1)}% spent</strong> of envelope
                  </span>

                  <div className="envelope-actions">
                    <button
                      className="tx-action-btn tx-edit-action"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit budget allocation"
                      aria-label="Edit budget"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="tx-action-btn tx-delete-action"
                      onClick={() => handleOpenDelete(item)}
                      title="Delete category budget"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      <BudgetModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingBudget}
        defaultMonth={selectedMonth}
        existingBudgets={budgets}
        categories={categories}
      />

      {/* Delete Budget Confirmation Modal */}
      <DeleteBudgetModal
        isOpen={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleConfirmDelete}
        budget={deletingBudget}
      />
    </div>
  );
};

export default Budgets;
