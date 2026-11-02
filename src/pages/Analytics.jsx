import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  Filter,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import CashflowBarChart from '../components/CashflowBarChart';
import CategoryDoughnutChart from '../components/CategoryDoughnutChart';
import { formatINR, getMonthName } from '../utils/formatters';
import './Analytics.css';

const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const Analytics = () => {
  const {
    getFilteredAnalytics,
    getAvailableYears,
    activeMonthKey,
  } = useLedgerData();

  // Filters State
  const [selectedYear, setSelectedYear] = useState(() => {
    return activeMonthKey ? activeMonthKey.substring(0, 4) : '2026';
  });
  const [selectedMonth, setSelectedMonth] = useState('all');

  const availableYears = useMemo(() => {
    return getAvailableYears();
  }, [getAvailableYears]);

  // Compute dynamic analytics using centralized service
  const analytics = useMemo(() => {
    return getFilteredAnalytics({
      year: selectedYear,
      month: selectedMonth,
    });
  }, [getFilteredAnalytics, selectedYear, selectedMonth]);

  const hasActiveFilters = selectedYear !== 'all' || selectedMonth !== 'all';

  const resetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  };

  const formattedPeriodLabel = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') return 'All-Time Financial History';
    if (selectedYear !== 'all' && selectedMonth === 'all') return `Entire Year ${selectedYear}`;
    const mNum = parseInt(selectedMonth, 10) - 1;
    if (selectedYear === 'all') return `Every ${getMonthName(mNum)}`;
    return `${getMonthName(mNum)} ${selectedYear}`;
  }, [selectedYear, selectedMonth]);

  return (
    <div className="analytics-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Financial Analytics & Trends</h2>
          <p className="page-subtitle">
            Comprehensive audit of cash flow velocity, category allocation, and burn rate
          </p>
        </div>

        {/* Filter Controls: Year & Month */}
        <div className="analytics-filter-controls">
          <div className="analytics-filter-box">
            <Calendar size={14} className="filter-icon" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="analytics-select"
              aria-label="Filter by year"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="analytics-filter-box">
            <Filter size={14} className="filter-icon" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="analytics-select"
              aria-label="Filter by month"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary analytics-reset-btn"
              onClick={resetFilters}
              title="Reset period filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Period Context Badge */}
      <div className="analytics-period-badge">
        <Sparkles size={14} color="#15966A" />
        <span>Auditing: <strong>{formattedPeriodLabel}</strong> ({analytics.totalCount} transactions analyzed)</span>
      </div>

      {/* KPI Stats Grid */}
      <div className="analytics-kpi-grid">
        {/* Net Savings */}
        <div className="card analytics-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Net Savings</span>
            <div className="kpi-icon-box icon-savings">
              <TrendingUp size={18} />
            </div>
          </div>
          <div
            className="kpi-value"
            style={{ color: analytics.netSavings >= 0 ? 'var(--income)' : 'var(--expense)' }}
          >
            {analytics.netSavings >= 0 ? '+' : ''}{formatINR(analytics.netSavings)}
          </div>
          <div className="kpi-footer">
            <span className={analytics.netSavings >= 0 ? 'text-income' : 'text-expense'}>
              {analytics.netSavings >= 0 ? 'Liquid Capital Surplus' : 'Net Period Deficit'}
            </span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="card analytics-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Savings Rate</span>
            <div className="kpi-icon-box icon-rate">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {analytics.savingsRate.toFixed(1)}%
          </div>
          <div className="kpi-footer">
            <span>
              {analytics.savingsRate >= 20 ? 'Above 20% benchmark' : 'Below recommended 20%'}
            </span>
          </div>
        </div>

        {/* Highest Spending Category */}
        <div className="card analytics-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Highest Spending</span>
            <div className="kpi-icon-box icon-highest">
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-value kpi-value-truncate" title={analytics.highestSpendingCategory?.name || 'None'}>
            {analytics.highestSpendingCategory ? analytics.highestSpendingCategory.name : 'N/A'}
          </div>
          <div className="kpi-footer">
            {analytics.highestSpendingCategory ? (
              <span>
                {formatINR(analytics.highestSpendingCategory.value)} ({analytics.highestSpendingCategory.percentage.toFixed(0)}% of expenses)
              </span>
            ) : (
              <span>Zero recorded outflows</span>
            )}
          </div>
        </div>

        {/* Average Daily Expenses */}
        <div className="card analytics-kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Avg Daily Expenses</span>
            <div className="kpi-icon-box icon-daily">
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value text-expense">
            {formatINR(analytics.averageDailyExpense)}
          </div>
          <div className="kpi-footer">
            <span>Across ~{analytics.daysConsidered} calendar days</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Trends Chart + Category Breakdown */}
      {analytics.totalCount === 0 ? (
        <div className="card analytics-empty-card">
          <BarChart3 size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Financial Activity In This Period</h3>
          <p className="empty-state-desc">
            No income or expense transactions were found for <strong>{formattedPeriodLabel}</strong>.
            Try selecting a different year or month from the filters above.
          </p>
          <button className="btn btn-secondary empty-state-btn" onClick={resetFilters}>
            <RotateCcw size={15} />
            <span>Reset Period Filters</span>
          </button>
        </div>
      ) : (
        <>
          <div className="analytics-charts-grid">
            {/* Monthly Inflow & Outflow Trends */}
            <div className="chart-large-wrapper">
              <CashflowBarChart data={analytics.monthlyTrends} />
            </div>

            {/* Category Doughnut Distribution */}
            <div className="chart-small-wrapper">
              <CategoryDoughnutChart
                spending={{
                  items: analytics.categorySpending,
                  totalExpense: analytics.totalExpense,
                }}
              />
            </div>
          </div>

          {/* Full Category-Wise Spending Breakdown Table */}
          <div className="card analytics-category-table-card">
            <div className="cat-table-header-row">
              <div>
                <h3 className="chart-card-title">Category Spending Velocity</h3>
                <p className="chart-card-subtitle">
                  Ranked breakdown of expenditures for {formattedPeriodLabel}
                </p>
              </div>
              <span className="doughnut-total-badge">
                Total Outflow: {formatINR(analytics.totalExpense)}
              </span>
            </div>

            <div className="category-rank-list">
              {analytics.categorySpending.map((cat, idx) => (
                <div key={cat.name} className="category-rank-row">
                  <div className="rank-left-cell">
                    <span className="rank-number">#{idx + 1}</span>
                    <span
                      className="category-color-square"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="category-title-wrap">
                      <strong className="rank-cat-name">{cat.name}</strong>
                      <span className="rank-cat-meta">{cat.count} transactions</span>
                    </div>
                  </div>

                  <div className="rank-mid-cell">
                    <div className="rank-progress-track">
                      <div
                        className="rank-progress-fill"
                        style={{
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rank-right-cell">
                    <strong className="rank-spent-amount">{formatINR(cat.value)}</strong>
                    <span className="rank-spent-pct">{cat.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
