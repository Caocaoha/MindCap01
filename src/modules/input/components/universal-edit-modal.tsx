import React, { useEffect, useState } from 'react';
import { useUiStore } from '../../../store/ui-store';
import { useJourneyStore } from '../../../store/journey-store';
import { EntryForm } from './entry-form';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [COMPONENT]: Modal chỉnh sửa vạn năng (Universal Edit Modal).
 * Đóng vai trò Container quản lý logic chuyển đổi dữ liệu (Migration)
 * và hiển thị EntryForm trong một lớp phủ tập trung.
 */
export const UniversalEditModal: React.FC = () => {
  // --- STORE CONNECTIONS ---
  const { isModalOpen, editingEntry, closeModal } = useUiStore();
  const { migrateEntry } = useJourneyStore();
  
  // State để kiểm soát Animation mount/unmount
  const [isVisible, setIsVisible] = useState(false);

  // Hiệu ứng Fade-in/Fade-out
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

  /**
   * [CORE LOGIC]: Xử lý lưu và chuyển đổi loại dữ liệu.
   * Hàm này được truyền vào EntryForm thông qua prop 'onCustomSave'.
   */
  const handleMigrateAndSave = async (newType: 'task' | 'thought', newData: any) => {
    if (!editingEntry || !editingEntry.id) return;

    // 1. Xác định loại dữ liệu gốc
    const originalType = 'status' in editingEntry ? 'task' : 'thought';

    // 2. Gọi Store để thực hiện Update hoặc Migrate (Xóa cũ -> Tạo mới)
    // Logic phức tạp này đã được đóng gói trong journey-store.ts
    await migrateEntry(editingEntry.id, originalType, newType, newData);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* BACKDROP: Làm mờ nền & Đóng khi click ra ngoài */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={() => {
          triggerHaptic('light');
          closeModal();
        }}
      />

      {/* MODAL CONTAINER: Chứa EntryForm */}
      <div 
        className={`relative w-full max-w-lg bg-white rounded-[8px] shadow-2xl transform transition-all duration-300 ${
          isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* THANH TIÊU ĐỀ NHỎ (Optional handle) */}
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* NỘI DUNG FORM */}
        {/* Tái sử dụng EntryForm với dữ liệu ban đầu từ editingEntry */}
        <div className="p-1">
          <EntryForm 
            initialData={editingEntry}
            onSuccess={() => {
              // Đóng modal sau khi lưu thành công
              closeModal();
            }}
            onCancel={() => {
              closeModal();
            }}
            // [CRITICAL]: Kích hoạt chế độ Delegated Save để xử lý Migrate
            onCustomSave={handleMigrateAndSave}
          />
        </div>
      </div>
    </div>
  );
};