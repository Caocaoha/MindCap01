import React from 'react';
import { useUiStore } from '../../../store/ui-store';
import { EntryForm } from './entry-form';

/**
 * [MOD_INPUT_UI]: Lớp phủ Modal bao bọc Form nhập liệu vạn năng.
 * Giai đoạn 6.1: Tích hợp chỉ báo Liên kết (Link Mode Indicator) cho Memory Spark v2.1.
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
        
        {/* [NEW]: CHỈ BÁO TRẠNG THÁI LIÊN KẾT (LINK MODE) */}
        {editingEntry?.isLinkMode && (
          <div className="mb-3 flex items-center gap-2 px-1 animate-in slide-in-from-left-4 duration-500">
            {/* Biểu tượng xung nhịp (Pulse) màu xanh để tạo sự chú ý */}
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 drop-shadow-sm">
              Đang liên kết với bản ghi gốc
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-100 to-transparent" />
          </div>
        )}

        <EntryForm 
          initialData={editingEntry} 
          onSuccess={closeModal} 
          onCancel={closeModal} 
        />
      </div>
    </div>
  );
};