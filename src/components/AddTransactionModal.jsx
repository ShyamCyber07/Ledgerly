import React from 'react';
import TransactionModal from './TransactionModal';

export const AddTransactionModal = ({ isOpen, onClose, onAdd, categories, initialData = null }) => {
  return (
    <TransactionModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onAdd}
      categories={categories}
      initialData={initialData}
    />
  );
};

export default AddTransactionModal;
