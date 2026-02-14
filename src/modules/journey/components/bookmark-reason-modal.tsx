import React, { useState } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [MOD_JOURNEY_UI]: Popup nhập lý do khi gieo hạt (bookmark) ký ức.
 * Giai đoạn 4: Thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Đặc điểm: Chuyển đổi màu nhấn từ Vàng sang Xanh đậm #2563EB để đồng bộ hệ thống.
 */
export const BookmarkReasonModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string) => void 
}> = ({ isOpen, onClose, onConfirm }) => {
  const [val, setVal] = useState('');

  // BẢO TỒN 100% LOGIC HIỂN THỊ
  if (!isOpen) return null;

  return (
    /* LỚP PHỦ (BACKDROP): Chuyển sang sáng/mờ chuẩn Linear thay vì đen tuyền */
    <div className="fixed inset-0 z-[100] bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      
      {/* CONTAINER: Nền trắng, Border Slate-200, Bo góc 6px, Loại bỏ shadow-2xl */}
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-[6px] p-8 shadow-none transition-all">
        
        {/* TIÊU ĐỀ: Chuyển sang màu Xanh nhấn #2563EB, Font Inter Bold */}
        <h3 className="text-[#2563EB] text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
          Gieo hạt ký ức
        </h3>
        
        {/* MÔ TẢ: Chuyển sang Slate-500 */}
        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
          Tại sao bạn muốn giữ lại khoảnh khắc này?
        </p>

        {/* TEXTAREA: Nền trắng, Border Slate mảnh, bo góc 6px */}
        <textarea 
          autoFocus
          value={val}
          className="w-full bg-white border border-slate-200 rounded-[6px] p-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#2563EB] min-h-[120px] mb-6 placeholder:text-slate-300 transition-all"
          placeholder="Lý do đánh dấu..."
          onChange={(e) => setVal(e.target.value)}
        />

        {/* CỤM ĐIỀU KHIỂN: Nút phẳng, bo góc kỹ thuật */}
        <div className="flex gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); onClose(); }} 
            className="flex-1 py-3 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-colors"
          >
            Hủy bỏ
          </button>
          
          {/* NÚT XÁC NHẬN: Màu xanh nhấn #2563EB, Text trắng */}
          <button 
            onClick={() => { triggerHaptic('success'); onConfirm(val); setVal(''); }}
            className="flex-1 bg-[#2563EB] text-white py-3 rounded-[6px] text-[10px] font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
          >
            Lưu giữ
          </button>
        </div>
      </div>
    </div>
  );
};