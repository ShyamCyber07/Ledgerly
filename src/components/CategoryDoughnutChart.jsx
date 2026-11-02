import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatINR } from '../utils/formatters';
import { PieChart as PieChartIcon } from 'lucide-react';
import './CategoryDoughnutChart.css';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-pie-tooltip">
        <div className="pie-tooltip-header">
          <span className="pie-dot" style={{ backgroundColor: data.color }} />
          <strong>{data.name}</strong>
        </div>
        <div className="pie-tooltip-val">{formatINR(data.value)}</div>
        <div className="pie-tooltip-pct">{data.percentage.toFixed(1)}% of total outflows</div>
      </div>
    );
  }
  return null;
};

export const CategoryDoughnutChart = ({ spending = { items: [], totalExpense: 0 } }) => {
  const { items = [], totalExpense = 0 } = spending;
  const hasData = items && items.length > 0 && totalExpense > 0;

  if (!hasData) {
    return (
      <div className="card category-doughnut-card empty-chart-container">
        <div className="doughnut-header">
          <h3 className="chart-card-title">Expense Breakdown</h3>
          <p className="chart-card-subtitle">Spending by category</p>
        </div>
        <div className="chart-empty-state">
          <PieChartIcon size={40} className="empty-state-icon" />
          <p className="empty-state-title">No Expenses Recorded</p>
          <p className="empty-state-desc">
            Add expense entries to view an interactive visual breakdown by category.
          </p>
        </div>
      </div>
    );
  }

  // Display top 4-5 in legend, group remaining if many
  const topItems = items.slice(0, 5);

  return (
    <div className="card category-doughnut-card">
      <div className="doughnut-header">
        <div>
          <h3 className="chart-card-title">Expense Breakdown</h3>
          <p className="chart-card-subtitle">Spending distribution by category</p>
        </div>
        <span className="doughnut-total-badge">
          Total: {formatINR(totalExpense)}
        </span>
      </div>

      <div className="doughnut-visual-wrapper">
        <div className="doughnut-chart-box">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={items}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {items.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#15966A'} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="doughnut-center-label">
            <span className="center-label-caption">OUTFLOW</span>
            <span className="center-label-amount">{formatINR(totalExpense)}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="doughnut-legend-list">
          {topItems.map((item) => (
            <div key={item.name} className="doughnut-legend-row">
              <div className="legend-row-left">
                <span
                  className="legend-color-indicator"
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-category-name" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="legend-row-right">
                <span className="legend-amount-val">{formatINR(item.value)}</span>
                <span className="legend-percent-val">{item.percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDoughnutChart;

