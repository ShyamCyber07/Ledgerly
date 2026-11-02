import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Receipt,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import { formatINR, formatDate, getMonthName } from '../utils/formatters';
import './Reports.css';

const formatMonthLabel = (monthKey, activeMonthKey) => {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthNum = parseInt(monthStr, 10) - 1;
  const label = `${getMonthName(monthNum)} ${yearStr}`;
  return monthKey === activeMonthKey ? `${label} (Current)` : label;
};

export const Reports = () => {
  const {
    getMonthlyReportData,
    availableBudgetMonths,
    activeMonthKey,
  } = useLedgerData();

  const [selectedMonth, setSelectedMonth] = useState(() => activeMonthKey);

  const monthOptions = useMemo(() => {
    const list = availableBudgetMonths && availableBudgetMonths.length > 0
      ? availableBudgetMonths
      : [activeMonthKey];
    if (!list.includes(selectedMonth)) {
      return [selectedMonth, ...list].sort((a, b) => b.localeCompare(a));
    }
    return list;
  }, [availableBudgetMonths, activeMonthKey, selectedMonth]);

  // Compute complete report from centralized storage service
  const report = useMemo(() => {
    return getMonthlyReportData(selectedMonth);
  }, [getMonthlyReportData, selectedMonth]);

  // --- CSV Export Handlers ---
  const handleExportTransactionsCSV = () => {
    if (report.transactions.length === 0) {
      alert(`No transactions found for ${formatMonthLabel(selectedMonth, activeMonthKey)} to export.`);
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Title/Merchant', 'Amount (INR)', 'Payment Method', 'Notes'];
    const rows = report.transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${t.category || 'Other'}"`,
      `"${(t.title || t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${t.paymentMethod || 'UPI'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ledgerly-transactions-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportFullReportCSV = () => {
    const sections = [];

    // Header section
    sections.push(['LEDGERLY MONTHLY FINANCIAL STATEMENT']);
    sections.push(['Month', formatMonthLabel(selectedMonth, activeMonthKey)]);
    sections.push(['Exported On', new Date().toISOString()]);
    sections.push([]);

    // Summary section
    sections.push(['1. FISCAL SUMMARY']);
    sections.push(['Metric', 'Value (INR)']);
    sections.push(['Gross Inflow (Total Earnings)', report.totalIncome]);
    sections.push(['Gross Outflow (Total Expenses)', report.totalExpense]);
    sections.push(['Net Surplus (Savings)', report.netSavings]);
    sections.push(['Effective Savings Rate (%)', `${report.savingsRate.toFixed(2)}%`]);
    sections.push(['Total Transactions Count', report.totalCount]);
    sections.push(['Average Inflow Ticket', report.avgIncomeTicket.toFixed(2)]);
    sections.push(['Average Outflow Ticket', report.avgExpenseTicket.toFixed(2)]);
    sections.push([]);

    // Category Breakdown
    sections.push(['2. CATEGORY-WISE EXPENDITURE BREAKDOWN']);
    sections.push(['Category', 'Total Spent (INR)', 'Share of Outflow (%)', 'Transaction Count']);
    report.categoryBreakdown.forEach((c) => {
      sections.push([`"${c.name}"`, c.value, `${c.percentage.toFixed(2)}%`, c.count]);
    });
    sections.push([]);

    // Budget Utilization
    sections.push(['3. BUDGET UTILIZATION & ENVELOPE PERFORMANCE']);
    sections.push(['Category', 'Allocated Limit (INR)', 'Actual Expenses (INR)', 'Remaining Headroom (INR)', 'Utilization (%)', 'Status']);
    report.budgetUtilization.forEach((b) => {
      sections.push([
        `"${b.categoryName}"`,
        b.allocated,
        b.spent,
        b.remaining,
        `${b.rawPercentUsed.toFixed(1)}%`,
        b.warningLabel,
      ]);
    });

    const csvContent = sections.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ledgerly-financial-report-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Financial Reports & Statements</h2>
          <p className="page-subtitle">
            Formal accounting summaries, category burn rates, and budget audit reports
          </p>
        </div>

        <div className="reports-header-actions">
          {/* Month Selector */}
          <div className="reports-month-selector">
            <Calendar size={15} className="month-icon" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="reports-month-select"
              aria-label="Select report month"
            >
              {monthOptions.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey, activeMonthKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Export Action Buttons */}
          <div className="reports-export-btns">
            <button
              className="btn btn-secondary report-btn"
              onClick={handleExportTransactionsCSV}
              title="Download line-by-line transaction register as CSV"
            >
              <Download size={15} />
              <span>Export Ledger (.CSV)</span>
            </button>

            <button
              className="btn btn-accent report-btn"
              onClick={handleExportFullReportCSV}
              title="Download audit report with summary & categories as CSV"
            >
              <FileText size={15} />
              <span>Export Full Statement (.CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Financial Summary KPIs */}
      <div className="reports-kpi-row">
        <div className="card report-kpi-card">
          <span className="report-kpi-caption">Gross Inflows</span>
          <div className="report-kpi-val text-income">
            +{formatINR(report.totalIncome)}
          </div>
          <span className="report-kpi-sub">
            {report.incomeCount} credits • Avg {formatINR(report.avgIncomeTicket)}
          </span>
        </div>

        <div className="card report-kpi-card">
          <span className="report-kpi-caption">Gross Outflows</span>
          <div className="report-kpi-val text-expense">
            -{formatINR(report.totalExpense)}
          </div>
          <span className="report-kpi-sub">
            {report.expenseCount} debits • Avg {formatINR(report.avgExpenseTicket)}
          </span>
        </div>

        <div className="card report-kpi-card">
          <span className="report-kpi-caption">Net Liquid Surplus</span>
          <div
            className="report-kpi-val"
            style={{ color: report.netSavings >= 0 ? 'var(--income)' : 'var(--expense)' }}
          >
            {report.netSavings >= 0 ? '+' : ''}{formatINR(report.netSavings)}
          </div>
          <span className="report-kpi-sub">
            {report.netSavings >= 0 ? 'Net positive liquidity' : 'Expenditure deficit'}
          </span>
        </div>

        <div className="card report-kpi-card">
          <span className="report-kpi-caption">Savings Rate</span>
          <div className="report-kpi-val">
            {report.savingsRate.toFixed(1)}%
          </div>
          <span className="report-kpi-sub">
            Retained share of earnings
          </span>
        </div>
      </div>

      {report.totalCount === 0 ? (
        <div className="card report-empty-card">
          <Receipt size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Data For Selected Period</h3>
          <p className="empty-state-desc">
            No transactions or ledger records were found for {formatMonthLabel(selectedMonth, activeMonthKey)}.
            Select another month to generate financial statements.
          </p>
        </div>
      ) : (
        <div className="reports-content-grid">
          {/* Section 1: Category Breakdown Table */}
          <div className="card report-table-card">
            <div className="report-table-header">
              <div>
                <h3 className="chart-card-title">Category Spending Breakdown</h3>
                <p className="chart-card-subtitle">
                  Aggregated outflow distribution for {formatMonthLabel(selectedMonth, activeMonthKey)}
                </p>
              </div>
              <span className="badge badge-accent">
                {report.categoryBreakdown.length} Categories
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Total Spent</th>
                    <th className="text-right">Outflow Share</th>
                    <th className="text-center">Transactions</th>
                    <th style={{ width: '180px' }}>Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categoryBreakdown.map((item) => (
                    <tr key={item.name}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="category-color-square"
                            style={{ backgroundColor: item.color }}
                          />
                          <strong className="rank-cat-name">{item.name}</strong>
                        </div>
                      </td>
                      <td className="text-right">
                        <strong className="text-expense">{formatINR(item.value)}</strong>
                      </td>
                      <td className="text-right">
                        <span>{item.percentage.toFixed(1)}%</span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-neutral">{item.count}</span>
                      </td>
                      <td>
                        <div className="rank-progress-track">
                          <div
                            className="rank-progress-fill"
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Budget Utilization Table */}
          <div className="card report-table-card">
            <div className="report-table-header">
              <div>
                <h3 className="chart-card-title">Budget Envelope Utilization</h3>
                <p className="chart-card-subtitle">
                  Allocated threshold compliance and variance analysis
                </p>
              </div>
              <span className="doughnut-total-badge">
                Cap Limit: {formatINR(report.overallBudget.totalAllocated)}
              </span>
            </div>

            {report.budgetUtilization.length === 0 ? (
              <div className="report-mini-empty">
                <p className="text-muted">No budget envelopes configured for this month.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Allocated</th>
                      <th className="text-right">Actual Spent</th>
                      <th className="text-right">Remaining / (Over)</th>
                      <th className="text-right">Usage</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.budgetUtilization.map((b) => {
                      const isExceeded = b.warningStatus === 'exceeded';
                      const isHighWarning = b.warningStatus === 'high_warning';
                      const isWarning = b.warningStatus === 'warning';

                      return (
                        <tr key={b.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span
                                className="category-color-square"
                                style={{ backgroundColor: b.color }}
                              />
                              <strong className="rank-cat-name">{b.categoryName}</strong>
                            </div>
                          </td>
                          <td className="text-right">
                            <span>{formatINR(b.allocated)}</span>
                          </td>
                          <td className="text-right">
                            <strong className="text-expense">{formatINR(b.spent)}</strong>
                          </td>
                          <td className="text-right">
                            <strong className={isExceeded ? 'text-expense' : 'text-income'}>
                              {isExceeded ? `-${formatINR(b.exceededAmount)}` : formatINR(b.remaining)}
                            </strong>
                          </td>
                          <td className="text-right">
                            <strong>{b.rawPercentUsed.toFixed(1)}%</strong>
                          </td>
                          <td className="text-center">
                            {isExceeded && (
                              <span className="badge badge-expense">
                                <ShieldAlert size={11} /> Exceeded
                              </span>
                            )}
                            {isHighWarning && (
                              <span className="badge badge-warning-high">
                                <AlertTriangle size={11} /> 90%+
                              </span>
                            )}
                            {isWarning && (
                              <span className="badge badge-warning-mid">
                                <AlertCircle size={11} /> 75%+
                              </span>
                            )}
                            {!isExceeded && !isHighWarning && !isWarning && (
                              <span className="badge badge-income">
                                <CheckCircle2 size={11} /> Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Monthly Transactions Register Preview */}
          <div className="card report-table-card">
            <div className="report-table-header">
              <div>
                <h3 className="chart-card-title">Audited Monthly Transactions</h3>
                <p className="chart-card-subtitle">
                  {report.totalCount} timestamped entries in {formatMonthLabel(selectedMonth, activeMonthKey)}
                </p>
              </div>
              <button
                className="btn btn-secondary report-download-link"
                onClick={handleExportTransactionsCSV}
              >
                <Download size={14} />
                <span>Export Ledger CSV</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title & Notes</th>
                    <th>Category</th>
                    <th>Payment Method</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.slice(0, 10).map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <span className="text-muted-cell">{formatDate(tx.date)}</span>
                        </td>
                        <td>
                          <div className="tx-title-block">
                            <span className="tx-title-text">{tx.title || tx.description}</span>
                            {tx.notes && (
                              <span className="tx-notes-text">{tx.notes}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{tx.category || 'Other'}</span>
                        </td>
                        <td>
                          <span className="text-muted-cell flex items-center gap-1">
                            <CreditCard size={12} /> {tx.paymentMethod || 'UPI'}
                          </span>
                        </td>
                        <td className="text-right">
                          <strong className={isIncome ? 'text-income' : 'text-expense'}>
                            {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {report.transactions.length > 10 && (
                <div className="report-more-notice">
                  Showing first 10 of {report.transactions.length} records. Download CSV for the complete statement.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
