import { useState, useEffect, useCallback } from 'react';
import storageService from '../services/storageService';

const loadDataFromStorage = () => {
  storageService.initializeDefaults();
  return {
    transactions: storageService.getTransactions(),
    budgets: storageService.getBudgets(),
    categories: storageService.getCategories(),
    settings: storageService.getSettings(),
    metrics: storageService.getSummaryMetrics(),
    cashflowData: storageService.getMonthlyCashflow(6),
    categorySpending: storageService.getCategorySpending(),
    budgetProgress: storageService.getCategoryBudgetProgress(),
    insights: storageService.getFinancialInsights(),
    availableBudgetMonths: storageService.getAvailableBudgetMonths(),
    activeMonthKey: storageService.getActiveMonthKey(),
    loading: false,
  };
};

export const useLedgerData = () => {
  const [data, setData] = useState(loadDataFromStorage);

  const refreshAll = useCallback(() => {
    setData(loadDataFromStorage());
  }, []);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setData(loadDataFromStorage());
    });
    return () => unsubscribe();
  }, []);

  const addTransaction = useCallback((tx) => {
    return storageService.addTransaction(tx);
  }, []);

  const updateTransaction = useCallback((id, updatedFields) => {
    return storageService.updateTransaction(id, updatedFields);
  }, []);

  const deleteTransaction = useCallback((id) => {
    return storageService.deleteTransaction(id);
  }, []);

  const addBudget = useCallback((budgetData) => {
    return storageService.addBudget(budgetData);
  }, []);

  const updateBudget = useCallback((id, updatedFields) => {
    return storageService.updateBudget(id, updatedFields);
  }, []);

  const deleteBudget = useCallback((id) => {
    return storageService.deleteBudget(id);
  }, []);

  const getBudgetProgressForMonth = useCallback((monthKey) => {
    return storageService.getCategoryBudgetProgress(monthKey);
  }, []);

  const getBudgetSummaryForMonth = useCallback((monthKey) => {
    return storageService.getMonthlyBudgetSummary(monthKey);
  }, []);

  const getFilteredAnalytics = useCallback((filter) => {
    return storageService.getFilteredAnalytics(filter);
  }, []);

  const getAvailableYears = useCallback(() => {
    return storageService.getAvailableYears();
  }, []);

  const getMonthlyReportData = useCallback((monthKey) => {
    return storageService.getMonthlyReportData(monthKey);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    return storageService.saveSettings(newSettings);
  }, []);

  const exportAllDataAsJSON = useCallback(() => {
    return storageService.exportAllDataAsJSON();
  }, []);

  const importDataFromJSON = useCallback((rawInput) => {
    return storageService.importDataFromJSON(rawInput);
  }, []);

  const resetDemoData = useCallback(() => {
    storageService.resetDemoData();
  }, []);

  const clearAllData = useCallback(() => {
    storageService.clearAllData();
  }, []);

  return {
    ...data,
    refreshAll,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetProgressForMonth,
    getBudgetSummaryForMonth,
    getFilteredAnalytics,
    getAvailableYears,
    getMonthlyReportData,
    updateSettings,
    exportAllDataAsJSON,
    importDataFromJSON,
    resetDemoData,
    clearAllData,
  };
};

export default useLedgerData;
