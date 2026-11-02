import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  RotateCcw,
  X,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import TransactionModal from '../components/TransactionModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { formatINR, formatDate, parseLocalDate } from '../utils/formatters';
import { STANDARD_CATEGORIES } from '../utils/constants';
import './Transactions.css';

export const Transactions = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
  } = useLedgerData();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilterPreset, setDateFilterPreset] = useState('all'); // 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'title-asc' | 'title-desc'

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [currentTimestamp] = useState(() => Date.now());

  // Compute active filters flag
  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateFilterPreset !== 'all' ||
    customStartDate ||
    customEndDate
  );

  const resetAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFilterPreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date-desc');
  };

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    const nowDate = new Date(currentTimestamp);
    const currentYear = nowDate.getFullYear();
    const currentMonth = nowDate.getMonth(); // 0-indexed
    const thisMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lastMonthKey = currentMonth === 0
      ? `${currentYear - 1}-12`
      : `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const thirtyDaysAgoTime = currentTimestamp - 30 * 24 * 60 * 60 * 1000;

    return transactions.filter((tx) => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const titleMatch = (tx.title || tx.description || '').toLowerCase().includes(query);
        const categoryMatch = (tx.category || '').toLowerCase().includes(query);
        const notesMatch = (tx.notes || '').toLowerCase().includes(query);
        const methodMatch = (tx.paymentMethod || '').toLowerCase().includes(query);
        const amountMatch = String(tx.amount).includes(query);
        if (!titleMatch && !categoryMatch && !notesMatch && !methodMatch && !amountMatch) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 4. Date Filter (Timezone-safe string and local date comparison)
      if (tx.date) {
        const txDateStr = (tx.date || '').split('T')[0];
        const txMonthKey = txDateStr.substring(0, 7);

        if (dateFilterPreset === 'this_month') {
          if (txMonthKey !== thisMonthKey) {
            return false;
          }
        } else if (dateFilterPreset === 'last_month') {
          if (txMonthKey !== lastMonthKey) {
            return false;
          }
        } else if (dateFilterPreset === 'last_30_days') {
          const txTime = parseLocalDate(tx.date)?.getTime() || 0;
          if (txTime < thirtyDaysAgoTime) {
            return false;
          }
        } else if (dateFilterPreset === 'custom') {
          if (customStartDate && txDateStr < customStartDate) {
            return false;
          }
          if (customEndDate && txDateStr > customEndDate) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortBy === 'date-desc') {
        const timeA = parseLocalDate(a.date)?.getTime() || 0;
        const timeB = parseLocalDate(b.date)?.getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === 'date-asc') {
        const timeA = parseLocalDate(a.date)?.getTime() || 0;
        const timeB = parseLocalDate(b.date)?.getTime() || 0;
        return timeA - timeB;
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'title-asc') {
        const titleA = (a.title || a.description || '').toLowerCase();
        const titleB = (b.title || b.description || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'title-desc') {
        const titleA = (a.title || a.description || '').toLowerCase();
        const titleB = (b.title || b.description || '').toLowerCase();
        return titleB.localeCompare(titleA);
      }
      return 0;
    });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    dateFilterPreset,
    customStartDate,
    customEndDate,
    sortBy,
    currentTimestamp,
  ]);

  // Aggregate stats for currently filtered slice
  const filteredMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  // Handle Add / Edit submit
  const handleModalSubmit = (payload) => {
    if (editingTransaction && editingTransaction.id) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setModalOpen(true);
  };

  const handleOpenDelete = (tx) => {
    setDeletingTransaction(tx);
  };

  const handleConfirmDelete = (id) => {
    deleteTransaction(id);
    setDeletingTransaction(null);
  };

  return (
    <div className="tx-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Transactions Ledger</h2>
          <p className="page-subtitle">
            Complete financial records with multi-dimensional filtering, search, and audit actions
          </p>
        </div>

        <button className="btn btn-accent" onClick={handleOpenAdd}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filtered Financial Metrics Summary Bar */}
      <div className="tx-summary-stats-bar">
        <div className="tx-stat-item">
          <span className="tx-stat-caption">Transactions Count</span>
          <div className="tx-stat-num">
            {filteredMetrics.count}
            {filteredMetrics.count !== transactions.length && (
              <span className="tx-stat-sub-label"> of {transactions.length} total</span>
            )}
          </div>
        </div>

        <div className="tx-stat-divider" />

        <div className="tx-stat-item">
          <span className="tx-stat-caption">Filtered Inflow</span>
          <div className="tx-stat-num text-income">
            +{formatINR(filteredMetrics.income)}
          </div>
        </div>

        <div className="tx-stat-divider" />

        <div className="tx-stat-item">
          <span className="tx-stat-caption">Filtered Outflow</span>
          <div className="tx-stat-num text-expense">
            -{formatINR(filteredMetrics.expense)}
          </div>
        </div>

        <div className="tx-stat-divider" />

        <div className="tx-stat-item">
          <span className="tx-stat-caption">Net Period Cash Flow</span>
          <div
            className="tx-stat-num"
            style={{ color: filteredMetrics.net >= 0 ? 'var(--income)' : 'var(--expense)' }}
          >
            {filteredMetrics.net >= 0 ? '+' : ''}{formatINR(filteredMetrics.net)}
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters, Sorters */}
      <div className="card tx-toolbar-card">
        {/* Top line: Search and Type Pills */}
        <div className="tx-toolbar-top-row">
          <div className="tx-search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by merchant, note, category, method, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tx-search-field"
            />
            {searchTerm && (
              <button
                className="tx-search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filter-pill-group">
            <button
              className={`filter-pill-btn ${typeFilter === 'all' ? 'filter-pill-active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All Types
            </button>
            <button
              className={`filter-pill-btn ${typeFilter === 'income' ? 'filter-pill-active' : ''}`}
              onClick={() => setTypeFilter('income')}
            >
              Income
            </button>
            <button
              className={`filter-pill-btn ${typeFilter === 'expense' ? 'filter-pill-active' : ''}`}
              onClick={() => setTypeFilter('expense')}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Bottom line: Category Filter, Date Filter, Sorting, Reset */}
        <div className="tx-toolbar-bottom-row">
          {/* Category Filter */}
          <div className="tx-filter-group">
            <span className="tx-filter-label">
              <Tag size={13} /> Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="tx-toolbar-select"
            >
              <option value="all">All Categories</option>
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div className="tx-filter-group">
            <span className="tx-filter-label">
              <Calendar size={13} /> Timeframe:
            </span>
            <select
              value={dateFilterPreset}
              onChange={(e) => setDateFilterPreset(e.target.value)}
              className="tx-toolbar-select"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* Custom Date Pickers if active */}
          {dateFilterPreset === 'custom' && (
            <div className="tx-custom-date-row">
              <input
                type="date"
                placeholder="From"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="tx-date-input"
              />
              <span className="tx-date-sep">to</span>
              <input
                type="date"
                placeholder="To"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="tx-date-input"
              />
            </div>
          )}

          {/* Sort By */}
          <div className="tx-filter-group">
            <span className="tx-filter-label">
              <ArrowUpDown size={13} /> Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="tx-toolbar-select"
            >
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="amount-desc">Amount (Highest first)</option>
              <option value="amount-asc">Amount (Lowest first)</option>
              <option value="title-asc">Title (A to Z)</option>
              <option value="title-desc">Title (Z to A)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              className="tx-reset-filters-btn"
              onClick={resetAllFilters}
              title="Reset all active search and filter constraints"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="card tx-table-card">
        {filteredTransactions.length === 0 ? (
          <div className="tx-empty-state">
            <Receipt size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No Transactions Found</h3>
            <p className="empty-state-desc">
              {hasActiveFilters
                ? 'No ledger entries matched your active search or filter criteria. Try resetting filters.'
                : 'Your transaction register is currently empty. Record your first income or expense.'}
            </p>
            {hasActiveFilters ? (
              <button className="btn btn-secondary empty-state-btn" onClick={resetAllFilters}>
                <RotateCcw size={15} />
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button className="btn btn-accent empty-state-btn" onClick={handleOpenAdd}>
                <Plus size={16} />
                <span>Add First Transaction</span>
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th className="text-right">Amount (INR)</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="tx-table-row">
                      {/* Type Icon */}
                      <td style={{ width: '48px' }}>
                        <div
                          className={`tx-icon-wrap ${
                            isIncome ? 'tx-icon-income' : 'tx-icon-expense'
                          }`}
                          title={isIncome ? 'Income (Inflow)' : 'Expense (Outflow)'}
                        >
                          {isIncome ? (
                            <ArrowDownLeft size={17} strokeWidth={2.4} />
                          ) : (
                            <ArrowUpRight size={17} strokeWidth={2.4} />
                          )}
                        </div>
                      </td>

                      {/* Title & Notes */}
                      <td>
                        <div className="tx-title-block">
                          <span className="tx-title-text" title={tx.title || tx.description}>
                            {tx.title || tx.description}
                          </span>
                          {tx.notes && (
                            <span className="tx-notes-text" title={tx.notes}>
                              <FileText size={11} className="tx-notes-icon" />
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <span className="badge badge-neutral tx-category-tag">
                          {tx.category || 'Other'}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td>
                        <span className="text-muted-cell flex items-center gap-1">
                          <CreditCard size={12} /> {tx.paymentMethod || 'UPI'}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="text-muted-cell">{formatDate(tx.date)}</span>
                      </td>

                      {/* Formatted Amount */}
                      <td className="text-right">
                        <strong
                          className={`tx-amount-display ${
                            isIncome ? 'tx-amount-income' : 'tx-amount-expense'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                        </strong>
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <div className="tx-row-actions">
                          <button
                            className="tx-action-btn tx-edit-action"
                            onClick={() => handleOpenEdit(tx)}
                            title="Edit transaction details"
                            aria-label="Edit transaction"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="tx-action-btn tx-delete-action"
                            onClick={() => handleOpenDelete(tx)}
                            title="Delete transaction entry"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Transaction Modal for Add & Edit */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingTransaction}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        transaction={deletingTransaction}
      />
    </div>
  );
};

export default Transactions;
