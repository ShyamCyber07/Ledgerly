import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AddTransactionModal from '../components/AddTransactionModal';
import useLedgerData from '../hooks/useLedgerData';
import './MainLayout.css';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { metrics, resetDemoData, addTransaction, categories, settings } = useLedgerData();

  return (
    <div className="main-layout-root">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <div className="main-layout-content-wrapper">
        {/* Top Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onResetDemo={resetDemoData}
          isDemoData={metrics?.isDemoData}
          userName={settings?.userName}
        />

        {/* Dynamic Route Content */}
        <main className="main-layout-page-container">
          <Outlet context={{ onOpenAddModal: () => setIsAddModalOpen(true) }} />
        </main>
      </div>

      {/* Interactive Modal to add new transactions */}
      {isAddModalOpen && (
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addTransaction}
          categories={categories}
        />
      )}
    </div>
  );
};

export default MainLayout;

