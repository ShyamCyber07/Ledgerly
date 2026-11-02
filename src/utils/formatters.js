/**
 * Return today's local calendar date in YYYY-MM-DD format
 * Prevents UTC midnight boundary rollbacks in positive UTC timezones (e.g. IST +05:30)
 */
export const getTodayDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse date safely to avoid UTC midnight offset shifts across timezones
 */
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Format currency to Indian Rupee (INR) or specified currency
 */
export const formatINR = (amount, includeDecimals = false) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(numericAmount);
};

export const formatCurrency = (amount, currency = 'INR', includeDecimals = false) => {
  if (currency === 'INR') {
    return formatINR(amount, includeDecimals);
  }
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(numericAmount);
};

/**
 * Format date nicely (e.g. "02 Nov 2026")
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = parseLocalDate(dateInput);
  if (!date) return dateInput;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format relative date (Today, Yesterday, or standard date)
 */
export const formatRelativeDate = (dateInput) => {
  if (!dateInput) return '';
  const date = parseLocalDate(dateInput);
  if (!date) return dateInput;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today - target;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  
  return formatDate(dateInput);
};

export const formatPercent = (value, decimals = 1) => {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return `${num.toFixed(decimals)}%`;
};

export const getMonthName = (monthIndex) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return monthNames[monthIndex] || '';
};
