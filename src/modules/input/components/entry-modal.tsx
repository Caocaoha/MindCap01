import React from 'react';
import { useUiStore } from '../../../store/ui-store';
import { EntryForm } from './entry-form';

/**
 * [MOD_INPUT_UI]: Lớp phủ Modal bao bọc Form nhập liệu vạn năng.
 * Giai đoạn 4: Thẩm mỹ Linear.app (Slate backdrop, Standardized transitions).
 * Đã loại bỏ hoàn toàn các ký tự gây lỗi TS1381.
 */
export const EntryModal: React.FC = () => {
  // BẢO TỒN 100% TRẠNG THÁI VÀ HÀM ĐIỀU KHIỂN TỪ STORE
  const { isModalOpen, editingEntry, closeModal } = useUiStore();

  // Kiểm tra trạng thái hiển thị (Bảo tồn logic gốc)
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
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