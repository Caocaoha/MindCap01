import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { EntryForm } from './components/entry-form';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh, điều hướng dữ liệu vào Store.
 * Đã chuyển đổi sang thẻ button và bổ sung logic ngăn chặn nổi bọt để xử lý lỗi tương tác.
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  const { isInputFocused, setInputFocused } = useUiStore();

  return (
    <div className={`w-full transition-all duration-500 px-2`}>
      {!isInputFocused ? (
        /* [FIX]: Trạng thái thu gọn - Chuyển từ <div> sang <button> để trình duyệt ưu tiên sự kiện click.
           Sử dụng e.stopPropagation() để đảm bảo click không bị các lớp nền hoặc z-index thấp hơn nuốt mất.
        */
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click lan truyền xuống các lớp z-index thấp hơn
            onFocus();
          }}
          className="w-full text-left bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 text-white/20 text-sm cursor-pointer hover:border-white/10 transition-all active:scale-[0.98] outline-none"
        >
          Ghi lại điều bạn đang nghĩ...
        </button>
      ) : (
        /* [FIX]: Trạng thái mở rộng - Sử dụng EntryForm vạn năng.
           Thêm pointer-events-auto để đảm bảo vùng này luôn nhận được mọi tương tác chuột/tay.
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