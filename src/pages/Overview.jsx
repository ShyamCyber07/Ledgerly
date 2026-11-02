import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  RefreshCw,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import MetricCard from '../components/MetricCard';
import CashflowBarChart from '../components/CashflowBarChart';
import CategoryDoughnutChart from '../components/CategoryDoughnutChart';
import RecentTransactionsTable from '../components/RecentTransactionsTable';
import BudgetProgressCard from '../components/BudgetProgressCard';
import FinancialInsightsCard from '../components/FinancialInsightsCard';
import DemoDataBanner from '../components/DemoDataBanner';
import './Overview.css';

export const Overview = () => {
  const { onOpenAddModal } = useOutletContext() || {};
  const {
    metrics,
    cashflowData,
    categorySpending,
    budgetProgress,
    insights,
    transactions,
    deleteTransaction,
    resetDemoData,
    clearAllData,
    refreshAll,
  } = useLedgerData();

  // Dynamic trend tags
  const savingsRateText = metrics.savingsRate > 0
    ? `${metrics.savingsRate.toFixed(1)}% saved`
    : 'No net savings';

  const budgetUsedPct = metrics.budgetUtilizationRate.toFixed(0);

  return (
    <div className="overview-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Financial Overview</h2>
          <p className="page-subtitle">
            Holistic view of your liquid balances, cash flow, and monthly budget performance
          </p>
        </div>

        <div className="overview-header-actions">
          <button
            className="btn btn-secondary header-sync-btn"
            onClick={refreshAll}
            title="Refresh calculated state"
          >
            <RefreshCw size={15} />
            <span>Sync</span>
          </button>

          {onOpenAddModal && (
            <button className="btn btn-accent" onClick={onOpenAddModal}>
              <Plus size={16} strokeWidth={2.5} />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Demo Data Identifier Banner */}
      <DemoDataBanner
        isDemoData={metrics?.isDemoData}
        onReset={resetDemoData}
        onClear={clearAllData}
      />

      {/* Primary 4 Metric Cards */}
      <section className="overview-metrics-grid" aria-label="Key financial metrics">
        <MetricCard
          label="Total Balance"
          value={metrics.totalBalance}
          subtext="Net historical wealth"
          icon={Wallet}
          variant="primary"
          trend={{
            type: metrics.totalBalance >= 0 ? 'positive' : 'negative',
            text: metrics.totalBalance >= 0 ? 'Liquid Reserve' : 'Deficit',
          }}
        />

        <MetricCard
          label="Monthly Income"
          value={metrics.monthlyIncome}
          subtext="Total earnings this month"
          icon={ArrowDownLeft}
          variant="income"
          trend={{
            type: 'positive',
            text: savingsRateText,
          }}
        />

        <MetricCard
          label="Monthly Expenses"
          value={metrics.monthlyExpenses}
          subtext="Total outflows this month"
          icon={ArrowUpRight}
          variant="expense"
          trend={{
            type: 'negative',
            text: 'Outflow',
          }}
        />

        <MetricCard
          label="Remaining Budget"
          value={metrics.remainingBudget}
          subtext={`Limit: ₹${metrics.totalBudgetLimit.toLocaleString('en-IN')}`}
          icon={PiggyBank}
          variant="budget"
          trend={{
            type: metrics.budgetUtilizationRate <= 85 ? 'positive' : 'negative',
            text: `${budgetUsedPct}% Allocated`,
          }}
        />
      </section>

      {/* Visual Analytics Grid: Cashflow Bar Chart + Category Doughnut */}
      <section className="overview-charts-grid">
        <div className="chart-grid-col-large">
          <CashflowBarChart data={cashflowData} />
        </div>
        <div className="chart-grid-col-small">
          <CategoryDoughnutChart spending={categorySpending} />
        </div>
      </section>

      {/* Dual Column Layout: Recent Transactions + Budget Progress */}
      <section className="overview-tables-grid">
        <div className="tables-grid-col-left">
          <RecentTransactionsTable
            transactions={transactions}
            onDelete={deleteTransaction}
            onOpenAddModal={onOpenAddModal}
          />
        </div>

        <div className="tables-grid-col-right">
          <BudgetProgressCard budgets={budgetProgress} />
        </div>
      </section>

      {/* Dynamic Financial Intelligence Insights */}
      <section className="overview-insights-section">
        <FinancialInsightsCard insights={insights} />
      </section>
    </div>
  );
};

export default Overview;
