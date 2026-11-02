# Ledgerly – Smart Personal Expense & Budget Tracker

Ledgerly is a modern, responsive personal finance tracking application designed with human-centered ergonomics and instant financial clarity in mind. Built with React 19, Vite, Recharts, and plain CSS custom properties, it runs purely in the browser with `localStorage` persistence and zero backend dependencies.

---

## ✨ Features

- **Executive Financial Overview**: Real-time KPI metric cards (Total Balance, Monthly Income, Monthly Expenses, Remaining Budget), chronological cashflow trajectories, and category expenditure doughnut charts.
- **Transactions Ledger**: Multi-column sorting (Date, Amount, Category, Title), multi-dimensional filtering (Inflow/Outflow, Timeframe Presets, Custom Date Range, Category), keyword search, and modal-based CRUD operations with deletion confirmation.
- **Envelope Budgeting & Early Warning System**: Category spending thresholds with automated multi-tier health alerts:
  - 🟢 **Healthy**: Under 75% utilized
  - 🟡 **Warning**: 75% to 89% utilized
  - 🟠 **High Warning**: 90% to 99% utilized
  - 🔴 **Exceeded**: 100%+ limit breached
- **Financial Analytics & Burn Rate Audit**: Historical cashflow velocity, net savings, savings rate, highest spending category, and daily expense metrics filtered by year and month.
- **Reports & Dual CSV Export**: Monthly fiscal statement summaries, category burn breakdowns, envelope utilization audits, and one-click downloads for both **Ledger CSV** and **Full Statement CSV**.
- **Settings & Data Sovereignty**: Customizable profile display name, INR (`₹`) formatting preferences, JSON application backup export, corruption-guarded JSON restoration, and confirmation-gated factory wipe.

---

## 🛠 Tech Stack

- **Framework**: React 19 + JavaScript (ESM)
- **Bundler & Tooling**: Vite 8 + Rolldown
- **Routing**: React Router DOM v7 (Single Page Application with Vercel rewrites)
- **Data Visualization**: Recharts
- **Iconography**: Lucide React
- **Styling**: Plain CSS with CSS Custom Properties (`#14283D` Primary, `#15966A` Accent, `#F7F8F6` Canvas)
- **Storage**: Browser `localStorage` with reactive subscription listeners

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/ShyamCyber07/Ledgerly.git

# Navigate into the project directory
cd Ledgerly

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Building for Production

```bash
# Run linting
npm run lint

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## ☁️ Deploying to Vercel

Ledgerly includes a pre-configured `vercel.json` SPA rewrite file.

### One-Click Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
```

Or connect the repository `https://github.com/ShyamCyber07/Ledgerly` directly in the [Vercel Dashboard](https://vercel.com/new). Vercel will auto-detect Vite and set `dist` as the build output directory.

---

## 📄 License

MIT License. Free to use, adapt, and build upon.
