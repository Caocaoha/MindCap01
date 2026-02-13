import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { EntryForm } from './components/entry-form';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh, điều hướng dữ liệu vào Store. 
 * Đã hiệu chỉnh sang thẻ button và bổ sung stopPropagation để khắc phục lỗi không click được trên iOS và Laptop. [cite: 6, 16]
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  const { isInputFocused, setInputFocused } = useUiStore();

  return (
    <div className={`w-full transition-all duration-500 px-2`}>
      {!isInputFocused ? (
        /* [FIX]: Trạng thái thu gọn - Chuyển từ <div> sang <button> để tối ưu tương tác Native.
           Bổ sung e.stopPropagation() để đảm bảo click không bị các lớp cha (z-index) hoặc lớp nền nuốt mất. [cite: 6, 16]
        */
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click tác động lên các lớp bên dưới
            onFocus();
          }}
          className="w-full text-left bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 text-white/20 text-sm cursor-pointer hover:border-white/10 transition-all active:scale-[0.98] outline-none"
        >
          Ghi lại điều bạn đang nghĩ...
        </button>
      ) : (
        /* [FIX]: Trạng thái mở rộng - Sử dụng EntryForm vạn năng.
           Thêm pointer-events-auto để đảm bảo các thành phần bên trong form nhận được tương tác chuột/tay. [cite: 6, 16]
        */
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto">
          <EntryForm 
            onSuccess={() => { setInputFocused(false); onBlur(); }}
            onCancel={() => { setInputFocused(false); onBlur(); }}
          />
        </div>
      )}
    </div>
  );
};