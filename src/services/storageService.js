import { STORAGE_KEYS } from '../utils/constants.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_BUDGETS,
  INITIAL_TRANSACTIONS,
  INITIAL_SETTINGS,
} from '../data/initialData.js';
import { getMonthName, getTodayDateString } from '../utils/formatters.js';

/**
 * Safe LocalStorage & Centralized Financial Calculation Service for Ledgerly
 * All calculations and data modifications flow through this service.
 */
class StorageService {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.listeners = new Set();
  }

  checkAvailability() {
    try {
      const testKey = '__ledgerly_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage is not available, falling back to memory mode:', e);
      return false;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error executing storage listener:', err);
      }
    });
  }

  getItem(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null || item === undefined) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading key "${key}" from localStorage:`, error);
      return defaultValue;
    }
  }

  setItem(key, value) {
    if (!this.isAvailable) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing key "${key}" to localStorage:`, error);
      return false;
    }
  }

  removeItem(key) {
    if (!this.isAvailable) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage:`, error);
    }
  }

  // --- Initial Data Seeding ---
  initializeDefaults(force = false) {
    const isInitialized = this.getItem(STORAGE_KEYS.INITIALIZED, false);
    if (!isInitialized || force) {
      this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      this.setItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
      this.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      this.setItem(STORAGE_KEYS.INITIALIZED, true);
      this.setItem(STORAGE_KEYS.IS_DEMO, true);
      this.notifyListeners();
    }
  }

  isDemoData() {
    return this.getItem(STORAGE_KEYS.IS_DEMO, false);
  }

  resetDemoData() {
    this.initializeDefaults(true);
  }

  clearAllData() {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.BUDGETS, []);
    this.setItem(STORAGE_KEYS.IS_DEMO, false);
    this.notifyListeners();
  }

  // --- Transactions ---
  getTransactions() {
    this.initializeDefaults();
    return this.getItem(STORAGE_KEYS.TRANSACTIONS, []) || [];
  }

  saveTransactions(transactions) {
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    this.setItem(STORAGE_KEYS.IS_DEMO, false);
    this.notifyListeners();
    return transactions;
  }

  addTransaction(transaction) {
    const list = this.getTransactions();
    const title = (transaction.title || transaction.description || 'Untitled Transaction').trim();
    const newTx = {
      ...transaction,
      id: transaction.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title,
      description: title,
      amount: parseFloat(transaction.amount) || 0,
      type: transaction.type || 'expense',
      category: transaction.category || 'Other',
      date: transaction.date || getTodayDateString(),
      paymentMethod: transaction.paymentMethod || 'UPI',
      notes: (transaction.notes || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTx, ...list];
    this.saveTransactions(updated);
    return newTx;
  }

  updateTransaction(id, updatedFields) {
    const list = this.getTransactions();
    const index = list.findIndex((tx) => tx.id === id);
    if (index === -1) {
      console.warn(`Transaction with id "${id}" not found.`);
      return null;
    }
    const existing = list[index];
    const title = (updatedFields.title || updatedFields.description || existing.title || existing.description || 'Untitled Transaction').trim();
    const merged = {
      ...existing,
      ...updatedFields,
      title: title,
      description: title,
      amount: updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) || 0 : existing.amount,
      type: updatedFields.type || existing.type,
      category: updatedFields.category || existing.category,
      date: updatedFields.date || existing.date,
      paymentMethod: updatedFields.paymentMethod || existing.paymentMethod,
      notes: updatedFields.notes !== undefined ? (updatedFields.notes || '').trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...list];
    updated[index] = merged;
    this.saveTransactions(updated);
    return merged;
  }

  deleteTransaction(id) {
    const list = this.getTransactions();
    const updated = list.filter((tx) => tx.id !== id);
    this.saveTransactions(updated);
    return updated;
  }

  // --- Budgets ---
  getBudgets(monthKey = null) {
    this.initializeDefaults();
    const allBudgets = this.getItem(STORAGE_KEYS.BUDGETS, []) || [];
    if (!monthKey) return allBudgets;
    const active = this.getActiveMonthKey();
    return allBudgets.filter((b) => b.month === monthKey || (!b.month && monthKey === active));
  }

  saveBudgets(budgets) {
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);
    this.notifyListeners();
    return budgets;
  }

  addBudget(budgetData) {
    const list = this.getBudgets(); // all budgets
    const categoryName = (budgetData.categoryName || '').trim();
    const targetMonth = budgetData.month || this.getActiveMonthKey();
    const limit = parseFloat(budgetData.limit) || 0;

    if (!categoryName) {
      throw new Error('Category name is required.');
    }
    if (limit <= 0) {
      throw new Error('Allocated budget amount must be greater than ₹0.');
    }

    // Prevent duplicate category budgets for the same month
    const duplicate = list.find(
      (b) =>
        b.categoryName.toLowerCase() === categoryName.toLowerCase() &&
        (b.month === targetMonth || (!b.month && targetMonth === this.getActiveMonthKey()))
    );

    if (duplicate) {
      throw new Error(`A budget for "${categoryName}" already exists for ${targetMonth}. You can edit the existing budget.`);
    }

    const categories = this.getCategories();
    const matchedCategory = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    const color = budgetData.color || matchedCategory?.color || '#15966A';
    const categoryId = matchedCategory?.id || `cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;

    const newBudget = {
      id: budgetData.id || `b-${targetMonth}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      month: targetMonth,
      categoryId,
      categoryName,
      limit,
      color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...list, newBudget];
    this.saveBudgets(updated);
    return newBudget;
  }

  updateBudget(id, updatedFields) {
    const list = this.getBudgets();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Budget with id "${id}" not found.`);
    }
    const existing = list[index];
    const categoryName = (updatedFields.categoryName || existing.categoryName).trim();
    const targetMonth = updatedFields.month || existing.month || this.getActiveMonthKey();
    const limit = updatedFields.limit !== undefined ? parseFloat(updatedFields.limit) : existing.limit;

    if (limit <= 0) {
      throw new Error('Allocated budget amount must be greater than ₹0.');
    }

    // Check duplicate if category or month changed
    const duplicate = list.find(
      (b) =>
        b.id !== id &&
        b.categoryName.toLowerCase() === categoryName.toLowerCase() &&
        (b.month === targetMonth || (!b.month && targetMonth === this.getActiveMonthKey()))
    );

    if (duplicate) {
      throw new Error(`A budget for "${categoryName}" already exists for ${targetMonth}.`);
    }

    const categories = this.getCategories();
    const matchedCategory = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    const color = updatedFields.color || existing.color || matchedCategory?.color || '#15966A';

    const merged = {
      ...existing,
      ...updatedFields,
      categoryName,
      month: targetMonth,
      limit,
      color,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...list];
    updated[index] = merged;
    this.saveBudgets(updated);
    return merged;
  }

  deleteBudget(id) {
    const list = this.getBudgets();
    const updated = list.filter((b) => b.id !== id);
    this.saveBudgets(updated);
    return updated;
  }

  getAvailableBudgetMonths() {
    const months = new Set();
    const active = this.getActiveMonthKey();
    months.add(active);

    const budgets = this.getBudgets();
    budgets.forEach((b) => {
      if (b.month) months.add(b.month);
    });

    const transactions = this.getTransactions();
    transactions.forEach((tx) => {
      const m = (tx.date || '').substring(0, 7);
      if (m && m.length === 7) months.add(m);
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }

  // --- Categories ---
  getCategories() {
    this.initializeDefaults();
    return this.getItem(STORAGE_KEYS.CATEGORIES, []) || [];
  }

  // --- Settings ---
  getSettings() {
    this.initializeDefaults();
    return this.getItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  saveSettings(settings) {
    const existing = this.getSettings();
    const updated = {
      ...existing,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    this.notifyListeners();
    return updated;
  }

  // --- JSON Backup & Restore ---
  exportAllDataAsJSON() {
    const payload = {
      app: 'Ledgerly',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions: this.getTransactions(),
        budgets: this.getBudgets(),
        categories: this.getCategories(),
        settings: this.getSettings(),
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  importDataFromJSON(rawInput) {
    if (!rawInput) {
      throw new Error('Backup data is empty. Please select a valid JSON backup file.');
    }

    let parsed;
    if (typeof rawInput === 'string') {
      try {
        parsed = JSON.parse(rawInput);
      } catch {
        throw new Error('Corrupted JSON file: Failed to parse JSON syntax. Please verify the file is not malformed.');
      }
    } else if (typeof rawInput === 'object') {
      parsed = rawInput;
    } else {
      throw new Error('Invalid input format: Expected a JSON file or string.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid backup structure: Root must be a JSON object.');
    }

    // Support both { data: { transactions, budgets, ... } } and direct { transactions, budgets, ... }
    const dataset = parsed.data || parsed;

    if (!dataset || typeof dataset !== 'object') {
      throw new Error('Invalid backup file: Missing dataset container.');
    }

    const hasTransactions = Array.isArray(dataset.transactions);
    const hasBudgets = Array.isArray(dataset.budgets);
    const hasCategories = Array.isArray(dataset.categories);
    const hasSettings = dataset.settings && typeof dataset.settings === 'object';

    if (!hasTransactions && !hasBudgets && !hasSettings) {
      throw new Error('Invalid backup schema: File must contain at least a "transactions" or "budgets" array.');
    }

    // Validate transactions structure if present
    if (hasTransactions) {
      for (let i = 0; i < dataset.transactions.length; i++) {
        const tx = dataset.transactions[i];
        if (!tx || typeof tx !== 'object') {
          throw new Error(`Corrupted transaction at index ${i}: Expected an object.`);
        }
        if (typeof tx.amount !== 'number' && isNaN(parseFloat(tx.amount))) {
          throw new Error(`Invalid amount in transaction record #${i + 1} ("${tx.title || 'Untitled'}").`);
        }
      }
    }

    // Validate budgets structure if present
    if (hasBudgets) {
      for (let i = 0; i < dataset.budgets.length; i++) {
        const b = dataset.budgets[i];
        if (!b || typeof b !== 'object') {
          throw new Error(`Corrupted budget at index ${i}: Expected an object.`);
        }
        if (!b.categoryName) {
          throw new Error(`Missing categoryName in budget record #${i + 1}.`);
        }
      }
    }

    // Apply validated backup to storage
    if (hasTransactions) {
      this.setItem(STORAGE_KEYS.TRANSACTIONS, dataset.transactions);
    }
    if (hasBudgets) {
      this.setItem(STORAGE_KEYS.BUDGETS, dataset.budgets);
    }
    if (hasCategories) {
      this.setItem(STORAGE_KEYS.CATEGORIES, dataset.categories);
    }
    if (hasSettings) {
      this.setItem(STORAGE_KEYS.SETTINGS, dataset.settings);
    }

    this.setItem(STORAGE_KEYS.IS_DEMO, false);
    this.setItem(STORAGE_KEYS.INITIALIZED, true);
    this.notifyListeners();

    return {
      success: true,
      transactionCount: hasTransactions ? dataset.transactions.length : 0,
      budgetCount: hasBudgets ? dataset.budgets.length : 0,
      timestamp: parsed.exportedAt || new Date().toISOString(),
    };
  }

  // ==========================================
  // CENTRALIZED FINANCIAL CALCULATIONS
  // ==========================================

  /**
   * Helper to determine target active month (defaults to current month or most recent tx month)
   */
  getActiveMonthKey(targetDate = null) {
    if (targetDate) {
      const d = new Date(targetDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * 1. Overview Summary Metrics (Total Balance, Monthly Income, Monthly Expenses, Remaining Budget)
   */
  getSummaryMetrics() {
    const activeMonthKey = this.getActiveMonthKey();
    const transactions = this.getTransactions();
    const currentBudgets = this.getBudgets(activeMonthKey);

    let totalHistoricalIncome = 0;
    let totalHistoricalExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const txMonth = (tx.date || '').substring(0, 7);

      if (tx.type === 'income') {
        totalHistoricalIncome += amt;
        if (txMonth === activeMonthKey) {
          currentMonthIncome += amt;
        }
      } else if (tx.type === 'expense') {
        totalHistoricalExpense += amt;
        if (txMonth === activeMonthKey) {
          currentMonthExpense += amt;
        }
      }
    });

    const totalBalance = totalHistoricalIncome - totalHistoricalExpense;
    const totalBudgetLimit = currentBudgets.reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
    const remainingBudget = Math.max(0, totalBudgetLimit - currentMonthExpense);
    const savingsAmount = currentMonthIncome - currentMonthExpense;
    const savingsRate = currentMonthIncome > 0 ? (savingsAmount / currentMonthIncome) * 100 : 0;
    const budgetUtilizationRate = totalBudgetLimit > 0 ? (currentMonthExpense / totalBudgetLimit) * 100 : 0;

    return {
      totalBalance,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpense,
      totalBudgetLimit,
      remainingBudget,
      savingsAmount,
      savingsRate,
      budgetUtilizationRate,
      totalTransactionsCount: transactions.length,
      isDemoData: this.isDemoData(),
      activeMonthKey,
    };
  }

  /**
   * 2. Monthly Income vs Expenses Bar Chart Data
   * Groups transactions chronologically by month
   */
  getMonthlyCashflow(monthsCount = 6) {
    const transactions = this.getTransactions();
    const monthMap = new Map();

    // Populate all unique months or last 4-6 months
    transactions.forEach((tx) => {
      const monthKey = (tx.date || '').substring(0, 7);
      if (!monthKey || monthKey.length < 7) return;

      if (!monthMap.has(monthKey)) {
        const [yearStr, monthStr] = monthKey.split('-');
        const monthNum = parseInt(monthStr, 10) - 1;
        const yearShort = yearStr.substring(2);
        monthMap.set(monthKey, {
          key: monthKey,
          name: `${getMonthName(monthNum)} '${yearShort}`,
          income: 0,
          expenses: 0,
          net: 0,
        });
      }

      const entry = monthMap.get(monthKey);
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        entry.income += amt;
      } else if (tx.type === 'expense') {
        entry.expenses += amt;
      }
      entry.net = entry.income - entry.expenses;
    });

    // Sort chronologically
    const sorted = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    return sorted.slice(-monthsCount);
  }

  /**
   * 3. Category Spending Breakdown for Doughnut Chart
   * Filters to current month or overall
   */
  getCategorySpending(monthKey = null) {
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const activeMonth = monthKey || this.getActiveMonthKey();

    const categoryColorMap = new Map(categories.map((c) => [c.name, c.color]));
    const categoryTotals = new Map();
    let totalExpenseAmount = 0;

    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const txMonth = (tx.date || '').substring(0, 7);
      
      // If filtering by active month and there are transactions for this month, respect it
      if (monthKey && txMonth !== activeMonth) return;

      const catName = tx.category || 'Other';
      const amt = Number(tx.amount) || 0;
      totalExpenseAmount += amt;

      if (!categoryTotals.has(catName)) {
        categoryTotals.set(catName, {
          name: catName,
          value: 0,
          count: 0,
          color: categoryColorMap.get(catName) || '#64748B',
        });
      }

      const catData = categoryTotals.get(catName);
      catData.value += amt;
      catData.count += 1;
    });

    const result = Array.from(categoryTotals.values())
      .map((item) => ({
        ...item,
        percentage: totalExpenseAmount > 0 ? (item.value / totalExpenseAmount) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      items: result,
      totalExpense: totalExpenseAmount,
    };
  }

  /**
   * 4. Category Budget Progress
   * Computes actual spending per category from expense transactions only vs configured budget limit
   */
  getCategoryBudgetProgress(monthKey = null) {
    const activeMonth = monthKey || this.getActiveMonthKey();
    const budgets = this.getBudgets(activeMonth);
    const transactions = this.getTransactions();

    // Map actual category spending in this month strictly from expense transactions
    const categorySpendMap = new Map();
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const txMonth = (tx.date || '').substring(0, 7);
      if (txMonth !== activeMonth) return;

      const cat = tx.category || 'Other';
      const amt = Number(tx.amount) || 0;
      categorySpendMap.set(cat, (categorySpendMap.get(cat) || 0) + amt);
    });

    return budgets.map((b) => {
      const allocated = Number(b.limit) || 0;
      const spent = categorySpendMap.get(b.categoryName) || 0;
      const remaining = Math.max(0, allocated - spent);
      const exceededAmount = spent > allocated ? spent - allocated : 0;
      const rawPercentUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
      const percentUsed = Math.min(rawPercentUsed, 100);
      const isOverBudget = spent > allocated;

      // Warnings thresholds:
      // 75%: Warning
      // 90%: High warning
      // Over budget: Exceeded
      let warningStatus = 'normal'; // < 75%
      let warningLabel = 'Healthy';
      if (isOverBudget) {
        warningStatus = 'exceeded';
        warningLabel = 'Exceeded';
      } else if (rawPercentUsed >= 90) {
        warningStatus = 'high_warning';
        warningLabel = 'High Warning';
      } else if (rawPercentUsed >= 75) {
        warningStatus = 'warning';
        warningLabel = 'Warning';
      }

      return {
        id: b.id,
        month: b.month || activeMonth,
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        allocated,
        limit: allocated,
        spent,
        remaining,
        exceededAmount,
        percentUsed,
        rawPercentUsed,
        isOverBudget,
        warningStatus,
        warningLabel,
        color: b.color || '#15966A',
      };
    }).sort((a, b) => b.rawPercentUsed - a.rawPercentUsed);
  }

  /**
   * Monthly Budget Summary Metrics (Total allocated, total spent, remaining, warning counters)
   */
  getMonthlyBudgetSummary(monthKey = null) {
    const activeMonth = monthKey || this.getActiveMonthKey();
    const progress = this.getCategoryBudgetProgress(activeMonth);

    let totalAllocated = 0;
    let totalSpent = 0;
    let totalRemaining = 0;
    let exceededCount = 0;
    let highWarningCount = 0;
    let warningCount = 0;
    let normalCount = 0;

    progress.forEach((item) => {
      totalAllocated += item.allocated;
      totalSpent += item.spent;
      totalRemaining += item.remaining;
      if (item.warningStatus === 'exceeded') exceededCount++;
      else if (item.warningStatus === 'high_warning') highWarningCount++;
      else if (item.warningStatus === 'warning') warningCount++;
      else normalCount++;
    });

    const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return {
      month: activeMonth,
      totalAllocated,
      totalSpent,
      totalRemaining,
      percentSpent,
      totalCategories: progress.length,
      exceededCount,
      highWarningCount,
      warningCount,
      normalCount,
    };
  }

  /**
   * 5. Dynamic Financial Insights
   * Analyzes real computed metrics and returns actionable advice
   */
  getFinancialInsights() {
    const metrics = this.getSummaryMetrics();
    const { items: spendingItems } = this.getCategorySpending(metrics.activeMonthKey);
    const budgetProgress = this.getCategoryBudgetProgress(metrics.activeMonthKey);

    const insights = [];

    // Savings Rate Insight
    if (metrics.monthlyIncome > 0) {
      if (metrics.savingsRate >= 40) {
        insights.push({
          type: 'success',
          title: 'Outstanding Savings Rate',
          description: `You are saving ${metrics.savingsRate.toFixed(1)}% of your monthly income (₹${metrics.savingsAmount.toLocaleString('en-IN')}). Well above the standard 20% benchmark!`,
          badge: 'Top Tier',
        });
      } else if (metrics.savingsRate >= 20) {
        insights.push({
          type: 'info',
          title: 'Healthy Financial Runway',
          description: `Your monthly savings rate is healthy at ${metrics.savingsRate.toFixed(1)}%. You are steadily accumulating liquid capital.`,
          badge: 'Balanced',
        });
      } else if (metrics.savingsRate > 0) {
        insights.push({
          type: 'warning',
          title: 'Tight Savings Margin',
          description: `You are currently saving ${metrics.savingsRate.toFixed(1)}% of your income. Consider reviewing non-essential food and lifestyle subscriptions.`,
          badge: 'Attention',
        });
      } else {
        insights.push({
          type: 'danger',
          title: 'Expenditure Exceeds Inflow',
          description: `Current month expenses have surpassed earnings. Prioritize essential commitments and pause discretionary spends.`,
          badge: 'Deficit Alert',
        });
      }
    }

    // Budget Adherence Insight
    const overBudgetCategories = budgetProgress.filter((b) => b.isOverBudget);
    const nearLimitCategories = budgetProgress.filter((b) => b.rawPercentUsed >= 80 && !b.isOverBudget);

    if (overBudgetCategories.length > 0) {
      insights.push({
        type: 'danger',
        title: `${overBudgetCategories.length} Budget Overrun${overBudgetCategories.length > 1 ? 's' : ''}`,
        description: `${overBudgetCategories.map((c) => c.categoryName).join(', ')} has exceeded the monthly allocated threshold.`,
        badge: 'Over Budget',
      });
    } else if (nearLimitCategories.length > 0) {
      insights.push({
        type: 'warning',
        title: `${nearLimitCategories.length} Category Near Budget Limit`,
        description: `${nearLimitCategories.map((c) => c.categoryName).join(', ')} has consumed over 80% of its allocation with days remaining.`,
        badge: 'Watchlist',
      });
    } else if (budgetProgress.length > 0) {
      insights.push({
        type: 'success',
        title: 'Disciplined Budget Adherence',
        description: `All ${budgetProgress.length} monitored categories remain comfortably within planned thresholds.`,
        badge: 'On Track',
      });
    }

    // Top Expense Category
    if (spendingItems.length > 0) {
      const topCat = spendingItems[0];
      insights.push({
        type: 'neutral',
        title: `Primary Expense: ${topCat.name}`,
        description: `Accounting for ${topCat.percentage.toFixed(1)}% (₹${topCat.value.toLocaleString('en-IN')}) of total expenditures this month.`,
        badge: 'Top Cost',
      });
    }

    return insights;
  }

  /**
   * 6. Filtered Analytics Data
   * Supports filtering by Year ('all' or '2026') and Month ('all' or '01'-'12')
   */
  getFilteredAnalytics({ year = 'all', month = 'all' } = {}) {
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const categoryColorMap = new Map(categories.map((c) => [c.name, c.color]));

    // Filter transactions
    const filteredTx = transactions.filter((tx) => {
      const dateStr = tx.date || '';
      if (!dateStr || dateStr.length < 7) return false;
      const txYear = dateStr.substring(0, 4);
      const txMonth = dateStr.substring(5, 7);

      if (year !== 'all' && txYear !== String(year)) return false;
      if (month !== 'all' && txMonth !== String(month).padStart(2, '0')) return false;
      return true;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = new Map();
    const monthTotals = new Map();
    const uniqueDates = new Set();

    filteredTx.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const dateStr = tx.date || '';
      if (dateStr) uniqueDates.add(dateStr);

      const mKey = dateStr.substring(0, 7);
      if (mKey.length === 7) {
        if (!monthTotals.has(mKey)) {
          const [y, m] = mKey.split('-');
          const mNum = parseInt(m, 10) - 1;
          monthTotals.set(mKey, {
            key: mKey,
            name: `${getMonthName(mNum)} '${y.substring(2)}`,
            income: 0,
            expenses: 0,
            net: 0,
          });
        }
        const mEntry = monthTotals.get(mKey);
        if (tx.type === 'income') mEntry.income += amt;
        else if (tx.type === 'expense') mEntry.expenses += amt;
        mEntry.net = mEntry.income - mEntry.expenses;
      }

      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpense += amt;
        const cat = tx.category || 'Other';
        if (!categoryTotals.has(cat)) {
          categoryTotals.set(cat, {
            name: cat,
            value: 0,
            count: 0,
            color: categoryColorMap.get(cat) || '#64748B',
          });
        }
        const catEntry = categoryTotals.get(cat);
        catEntry.value += amt;
        catEntry.count += 1;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const categorySpending = Array.from(categoryTotals.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const highestSpendingCategory = categorySpending.length > 0 ? categorySpending[0] : null;

    let daysCount = 30;
    if (year !== 'all' && month !== 'all') {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      daysCount = new Date(y, m, 0).getDate();
    } else if (year !== 'all' && month === 'all') {
      daysCount = 365;
    } else {
      daysCount = Math.max(1, uniqueDates.size);
    }
    const averageDailyExpense = daysCount > 0 ? totalExpense / daysCount : 0;

    const monthlyTrends = Array.from(monthTotals.values()).sort((a, b) => a.key.localeCompare(b.key));

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      highestSpendingCategory,
      averageDailyExpense,
      categorySpending,
      monthlyTrends,
      totalCount: filteredTx.length,
      daysConsidered: daysCount,
    };
  }

  /**
   * Available Years list for filter dropdown
   */
  getAvailableYears() {
    const years = new Set();
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);

    const transactions = this.getTransactions();
    transactions.forEach((tx) => {
      const y = (tx.date || '').substring(0, 4);
      if (y && y.length === 4) years.add(y);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }

  /**
   * 7. Monthly Report Data
   * Full financial audit, category breakdown, budget utilization for a selected month
   */
  getMonthlyReportData(monthKey = null) {
    const targetMonth = monthKey || this.getActiveMonthKey();
    const transactions = this.getTransactions();
    const budgets = this.getBudgets(targetMonth);
    const categories = this.getCategories();
    const categoryColorMap = new Map(categories.map((c) => [c.name, c.color]));

    const monthTransactions = transactions.filter((tx) => {
      return (tx.date || '').substring(0, 7) === targetMonth;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const categorySpendMap = new Map();

    monthTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
        incomeCount += 1;
      } else if (tx.type === 'expense') {
        totalExpense += amt;
        expenseCount += 1;
        const cat = tx.category || 'Other';
        if (!categorySpendMap.has(cat)) {
          categorySpendMap.set(cat, {
            name: cat,
            value: 0,
            count: 0,
            color: categoryColorMap.get(cat) || '#64748B',
          });
        }
        const item = categorySpendMap.get(cat);
        item.value += amt;
        item.count += 1;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const avgIncomeTicket = incomeCount > 0 ? totalIncome / incomeCount : 0;
    const avgExpenseTicket = expenseCount > 0 ? totalExpense / expenseCount : 0;

    const categoryBreakdown = Array.from(categorySpendMap.values())
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const budgetUtilization = budgets.map((b) => {
      const allocated = Number(b.limit) || 0;
      const spent = categorySpendMap.get(b.categoryName)?.value || 0;
      const remaining = Math.max(0, allocated - spent);
      const exceededAmount = spent > allocated ? spent - allocated : 0;
      const rawPercent = allocated > 0 ? (spent / allocated) * 100 : 0;
      const percentUsed = Math.min(rawPercent, 100);
      const isOverBudget = spent > allocated;

      let warningStatus = 'normal';
      let warningLabel = 'Healthy';
      if (isOverBudget) {
        warningStatus = 'exceeded';
        warningLabel = 'Exceeded';
      } else if (rawPercent >= 90) {
        warningStatus = 'high_warning';
        warningLabel = 'High Warning';
      } else if (rawPercent >= 75) {
        warningStatus = 'warning';
        warningLabel = 'Warning';
      }

      return {
        id: b.id,
        categoryName: b.categoryName,
        allocated,
        spent,
        remaining,
        exceededAmount,
        percentUsed,
        rawPercentUsed: rawPercent,
        warningStatus,
        warningLabel,
        color: b.color || '#15966A',
      };
    }).sort((a, b) => b.rawPercentUsed - a.rawPercentUsed);

    const totalAllocated = budgetUtilization.reduce((sum, b) => sum + b.allocated, 0);
    const totalBudgetSpent = budgetUtilization.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = Math.max(0, totalAllocated - totalBudgetSpent);
    const overallBudgetPercent = totalAllocated > 0 ? (totalBudgetSpent / totalAllocated) * 100 : 0;

    return {
      month: targetMonth,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      incomeCount,
      expenseCount,
      totalCount: monthTransactions.length,
      avgIncomeTicket,
      avgExpenseTicket,
      categoryBreakdown,
      budgetUtilization,
      overallBudget: {
        totalAllocated,
        totalBudgetSpent,
        totalRemaining,
        overallBudgetPercent,
      },
      transactions: monthTransactions,
    };
  }
}

export const storageService = new StorageService();
export default storageService;
