import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatINR } from '../utils/formatters';
import { BarChart3 } from 'lucide-react';
import './CashflowBarChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
    const expenses = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
    const net = income - expenses;

    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-title">{label}</p>
        <div className="tooltip-row tooltip-income">
          <span>Inflow:</span>
          <strong>{formatINR(income)}</strong>
        </div>
        <div className="tooltip-row tooltip-expense">
          <span>Outflow:</span>
          <strong>{formatINR(expenses)}</strong>
        </div>
        <div className="tooltip-divider" />
        <div className="tooltip-row tooltip-net">
          <span>Net Savings:</span>
          <strong style={{ color: net >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {net >= 0 ? '+' : ''}{formatINR(net)}
          </strong>
        </div>
      </div>
    );
  }
  return null;
};

export const CashflowBarChart = ({ data = [] }) => {
  const hasData = data && data.length > 0 && data.some((d) => d.income > 0 || d.expenses > 0);

  if (!hasData) {
    return (
      <div className="card cashflow-chart-card empty-chart-container">
        <div className="chart-header-row">
          <div>
            <h3 className="chart-card-title">Income vs Expenses</h3>
            <p className="chart-card-subtitle">Monthly cash flow trends</p>
          </div>
        </div>
        <div className="chart-empty-state">
          <BarChart3 size={40} className="empty-state-icon" />
          <p className="empty-state-title">No Cash Flow Data Yet</p>
          <p className="empty-state-desc">
            Record your income and expenses to view monthly comparisons and cash flow trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card cashflow-chart-card">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-card-title">Income vs Expenses</h3>
          <p className="chart-card-subtitle">Monthly cash flow trends (INR)</p>
        </div>
        <div className="chart-legend-pills">
          <span className="legend-pill income-pill">
            <span className="legend-dot dot-income" /> Inflow
          </span>
          <span className="legend-pill expense-pill">
            <span className="legend-dot dot-expense" /> Outflow
          </span>
        </div>
      </div>

      <div className="chart-body-wrapper">
        <ResponsiveContainer width="100%" height={290}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="income"
              name="Inflow"
              fill="#15966A"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="expenses"
              name="Outflow"
              fill="#14283D"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashflowBarChart;
