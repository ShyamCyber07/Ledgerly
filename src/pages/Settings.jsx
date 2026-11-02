import React, { useState, useRef } from 'react';
import {
  User,
  Check,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  FileJson,
  X,
} from 'lucide-react';
import useLedgerData from '../hooks/useLedgerData';
import { getTodayDateString } from '../utils/formatters';
import './Settings.css';

export const Settings = () => {
  const {
    settings,
    updateSettings,
    exportAllDataAsJSON,
    importDataFromJSON,
    resetDemoData,
    clearAllData,
    transactions,
    budgets,
    categories,
    metrics,
  } = useLedgerData();

  // Profile Form State
  const [userName, setUserName] = useState(() => settings?.userName || 'Priya Sharma');
  const [email, setEmail] = useState(() => settings?.email || 'priya.sharma@example.com');
  const [savingsTarget, setSavingsTarget] = useState(() => settings?.monthlySavingsTargetPercent || 35);

  // Status & Feedback Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation Modals State
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  const fileInputRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage('');
  };

  // 1. Handle Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      showError('Display name cannot be empty.');
      return;
    }
    const targetNum = parseFloat(savingsTarget);
    if (isNaN(targetNum) || targetNum < 0 || targetNum > 100) {
      showError('Monthly savings target must be a percentage between 0% and 100%.');
      return;
    }

    updateSettings({
      userName: userName.trim(),
      email: email.trim(),
      monthlySavingsTargetPercent: targetNum,
    });

    showSuccess(`Profile settings saved successfully! Display name updated to "${userName.trim()}".`);
  };

  // 2. Handle Export JSON Backup
  const handleExportJSON = () => {
    try {
      const jsonContent = exportAllDataAsJSON();
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = getTodayDateString();
      link.setAttribute('href', url);
      link.setAttribute('download', `ledgerly-backup-${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Application data exported successfully! Backup file downloaded (${transactions.length} transactions, ${budgets.length} budgets).`);
    } catch (err) {
      showError(`Export failed: ${err.message}`);
    }
  };

  // 3. Handle File Upload & JSON Restore
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        if (!fileContent || typeof fileContent !== 'string') {
          showError('Unable to read backup file contents.');
          return;
        }

        const result = importDataFromJSON(fileContent);
        showSuccess(
          `Backup restored successfully! Loaded ${result.transactionCount} transactions and ${result.budgetCount} budget envelopes into localStorage.`
        );
      } catch (err) {
        showError(err.message || 'Corrupted or invalid JSON backup file.');
      }
    };

    reader.onerror = () => {
      showError('Error reading backup file from disk.');
    };

    reader.readAsText(file);
  };

  // 4. Handle Reset to Demo
  const handleConfirmResetDemo = () => {
    resetDemoData();
    setConfirmResetOpen(false);
    showSuccess('Application data restored to realistic Indian Rupee (INR) demo records.');
  };

  // 5. Handle Wipe All Data
  const handleConfirmWipe = () => {
    if (wipeConfirmText.trim().toUpperCase() !== 'CLEAR') {
      showError('Please type "CLEAR" into the confirmation field to confirm.');
      return;
    }
    clearAllData();
    setConfirmWipeOpen(false);
    setWipeConfirmText('');
    showSuccess('All transactions and budgets have been wiped. Empty states are now active in localStorage.');
  };

  const initials = (userName || 'Priya Sharma')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PS';

  return (
    <div className="settings-page-root">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2 className="page-title">Application Settings</h2>
          <p className="page-subtitle">
            Personalize your identity, manage currency preferences, and control localStorage backups
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="settings-alert-banner alert-success" role="alert">
          <CheckCircle2 size={18} className="alert-icon" />
          <div className="alert-text">{successMessage}</div>
          <button
            className="alert-dismiss-btn"
            onClick={() => setSuccessMessage('')}
            aria-label="Dismiss success"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="settings-alert-banner alert-error" role="alert">
          <AlertTriangle size={18} className="alert-icon" />
          <div className="alert-text">{errorMessage}</div>
          <button
            className="alert-dismiss-btn"
            onClick={() => setErrorMessage('')}
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="settings-layout-grid">
        {/* SECTION 1: Profile & Identity */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-box">
              <User size={20} />
            </div>
            <div>
              <h3 className="chart-card-title">User Profile & Display Identity</h3>
              <p className="chart-card-subtitle">
                Controls the account display name in the header and reports
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="profile-preview-strip">
              <div className="settings-avatar-preview">{initials}</div>
              <div className="profile-preview-text">
                <strong>{userName.trim() || 'Your Name'}</strong>
                <span>{email.trim() || 'ledgerly.user@local'}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Display Name</span>
                <span className="tx-required-mark">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Priya Sharma, Alex Verma"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email / Note</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Savings Target (%)</label>
              <div className="amount-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '0.875rem' }}
                />
              </div>
              <span className="form-hint-text">
                Benchmarks your monthly financial health score against your savings target.
              </span>
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="btn btn-accent">
                <Check size={16} strokeWidth={2.4} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: Currency & Regional Preferences */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-box icon-currency">
              <IndianRupee size={20} />
            </div>
            <div>
              <h3 className="chart-card-title">Currency & Regional Numbering</h3>
              <p className="chart-card-subtitle">
                Configured regional standard for financial ledgers
              </p>
            </div>
          </div>

          <div className="settings-form">
            <div className="currency-active-box">
              <div className="currency-box-top">
                <div className="flex items-center gap-2">
                  <span className="currency-glyph-badge">₹</span>
                  <div>
                    <h4 className="currency-title">Indian Rupee (INR)</h4>
                    <span className="currency-sub">ISO 4217 Currency Code: INR</span>
                  </div>
                </div>
                <span className="badge badge-income">Active Standard</span>
              </div>
              <p className="currency-desc">
                All ledger balances, transaction registers, and budget envelopes are computed and formatted with the official Indian Rupee glyph (₹) using the Indian numerical grouping convention (Lakhs & Crores: <code>en-IN</code>).
              </p>
            </div>

            <div className="regional-attributes-list">
              <div className="regional-attr-row">
                <span className="attr-name">Number Format Convention</span>
                <strong className="attr-value">en-IN (e.g. ₹1,45,000)</strong>
              </div>
              <div className="regional-attr-row">
                <span className="attr-name">Fractional Digits Display</span>
                <span className="attr-value">Smart Rounded (0 decimals on summaries, 2 in statement)</span>
              </div>
              <div className="regional-attr-row">
                <span className="attr-name">Fiscal Calendar Start</span>
                <span className="attr-value">1st of every calendar month</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Backup & Restore */}
        <div className="card settings-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-box icon-backup">
              <FileJson size={20} />
            </div>
            <div>
              <h3 className="chart-card-title">Backup & Restore Application Data</h3>
              <p className="chart-card-subtitle">
                Export and import complete JSON snapshots of your client-side ledger
              </p>
            </div>
          </div>

          <div className="settings-form">
            {/* Storage Overview Badges */}
            <div className="storage-summary-strip">
              <div className="storage-stat-pill">
                <span className="stat-label">Stored Transactions</span>
                <strong className="stat-value">{transactions.length}</strong>
              </div>
              <div className="storage-stat-pill">
                <span className="stat-label">Budget Envelopes</span>
                <strong className="stat-value">{budgets.length}</strong>
              </div>
              <div className="storage-stat-pill">
                <span className="stat-label">Categories</span>
                <strong className="stat-value">{categories.length}</strong>
              </div>
              <div className="storage-stat-pill">
                <span className="stat-label">Dataset State</span>
                <strong className="stat-value" style={{ color: metrics.isDemoData ? 'var(--warning)' : 'var(--accent)' }}>
                  {metrics.isDemoData ? 'Demo Dataset' : 'Custom Vault'}
                </strong>
              </div>
            </div>

            <div className="backup-actions-grid">
              {/* Export JSON Block */}
              <div className="backup-action-box">
                <div className="action-box-icon">
                  <Download size={22} color="#15966A" />
                </div>
                <h4 className="action-box-title">Export JSON Backup</h4>
                <p className="action-box-desc">
                  Downloads a complete machine-readable JSON archive of your transactions, budgets, categories, and settings.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary backup-trigger-btn"
                  onClick={handleExportJSON}
                >
                  <Download size={15} />
                  <span>Download Backup (.JSON)</span>
                </button>
              </div>

              {/* Restore JSON Block */}
              <div className="backup-action-box">
                <div className="action-box-icon icon-restore">
                  <Upload size={22} color="#2563EB" />
                </div>
                <h4 className="action-box-title">Restore JSON Backup</h4>
                <p className="action-box-desc">
                  Upload an existing Ledgerly JSON backup file to restore records. Validates structure and detects corrupted files.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary backup-trigger-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} />
                  <span>Upload & Restore (.JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Data Management & Reset Zone */}
        <div className="card settings-card settings-danger-card">
          <div className="settings-card-header">
            <div className="settings-header-icon-box icon-danger">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="chart-card-title">Reset & Data Management</h3>
              <p className="chart-card-subtitle">
                Restoration of demo dataset or complete browser localStorage reset
              </p>
            </div>
          </div>

          <div className="danger-zone-list">
            <div className="danger-row-item">
              <div>
                <h4 className="danger-item-title">Reset to Realistic Demo Records</h4>
                <p className="danger-item-desc">
                  Reloads default sample Indian Rupee transactions (salary, rent, groceries, dining), category envelopes, and multi-month cashflow history.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmResetOpen(true)}
              >
                <RotateCcw size={15} />
                <span>Reset Demo Data</span>
              </button>
            </div>

            <div className="danger-row-item">
              <div>
                <h4 className="danger-item-title text-danger">Wipe All Transactions & Budgets</h4>
                <p className="danger-item-desc">
                  Permanently clears all stored records from localStorage to preview zero-state dashboards or build from scratch.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-danger-action"
                onClick={() => {
                  setWipeConfirmText('');
                  setConfirmWipeOpen(true);
                }}
              >
                <Trash2 size={15} />
                <span>Wipe All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Reset Demo Data */}
      {confirmResetOpen && (
        <div className="delete-modal-backdrop" onClick={() => setConfirmResetOpen(false)} role="dialog" aria-modal="true">
          <div className="delete-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-alert-icon-box" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                <RotateCcw size={24} />
              </div>
              <button className="delete-modal-close-btn" onClick={() => setConfirmResetOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="delete-modal-content">
              <h3 className="delete-modal-title">Restore Realistic Demo Data?</h3>
              <p className="delete-modal-desc">
                This will replace your current transactions and category budgets with the default Indian Rupee sample records for Alex / Priya.
              </p>
            </div>

            <div className="delete-modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmResetOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={handleConfirmResetDemo}>
                <RotateCcw size={15} />
                <span>Confirm & Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Factory Wipe Data */}
      {confirmWipeOpen && (
        <div className="delete-modal-backdrop" onClick={() => setConfirmWipeOpen(false)} role="dialog" aria-modal="true">
          <div className="delete-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-alert-icon-box">
                <AlertTriangle size={24} />
              </div>
              <button className="delete-modal-close-btn" onClick={() => setConfirmWipeOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="delete-modal-content">
              <h3 className="delete-modal-title">Permanently Clear All Records?</h3>
              <p className="delete-modal-desc">
                This will delete all <strong>{transactions.length} transactions</strong> and <strong>{budgets.length} budgets</strong> from browser localStorage. This action cannot be reversed unless you have a JSON backup.
              </p>

              <div className="wipe-confirmation-input-box">
                <label className="form-label">
                  Type <strong>CLEAR</strong> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="CLEAR"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="delete-modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmWipeOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger-action"
                onClick={handleConfirmWipe}
                disabled={wipeConfirmText.trim().toUpperCase() !== 'CLEAR'}
                style={{
                  opacity: wipeConfirmText.trim().toUpperCase() === 'CLEAR' ? 1 : 0.5,
                  cursor: wipeConfirmText.trim().toUpperCase() === 'CLEAR' ? 'pointer' : 'not-allowed',
                }}
              >
                <Trash2 size={15} />
                <span>Wipe Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
