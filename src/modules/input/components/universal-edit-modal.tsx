import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../../store/ui-store';
import { EntryForm } from './entry-form';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [COMPONENT]: Modal chỉnh sửa vạn năng (Universal Edit Modal).
 * Business Rule: 
 * - Hien thi lop phu tap trung de sua doi moi loai ban ghi.
 * - [SIMPLIFIED]: Uy quyen toan bo logic Migration cho useEntryLogic ben trong EntryForm.
 */
export const UniversalEditModal: React.FC = () => {
  const { isModalOpen, editingEntry, closeModal } = useUiStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setIsVisible(true);
      triggerHaptic('light');
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  if (!isVisible && !isModalOpen) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
      isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={() => {
          triggerHaptic('light');
          closeModal();
        }}
      />

      <div className={`relative w-full max-w-lg bg-white rounded-[8px] shadow-2xl transform transition-all duration-300 ${
        isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="p-1">
          <EntryForm 
            initialData={editingEntry}
            onSuccess={() => closeModal()}
            onCancel={() => closeModal()}
            // Khong truyen onCustomSave de Hook tu dong thuc thi logic Migration ben trong
          />
        </div>
      </div>
    </div>
  );
};