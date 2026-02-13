import React from 'react';
import { useUiStore } from '../../../store/ui-store';
import { EntryForm } from './entry-form';

export const EntryModal: React.FC = () => {
  const { isModalOpen, editingEntry, closeModal } = useUiStore();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <EntryForm 
          initialData={editingEntry} 
          onSuccess={closeModal} 
          onCancel={closeModal} 
        />
      </div>
    </div>
  );
};