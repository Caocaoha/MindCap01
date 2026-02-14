import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { EntryForm } from './components/entry-form';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * [MOD_INPUT]: Thanh nhập liệu nhanh, điều hướng dữ liệu vào Store.
 * Giai đoạn 2/3: Cập nhật thẩm mỹ Linear.app (White base, Slate borders, 6px radius).
 * Bảo tồn 100% logic ngăn chặn nổi bọt và điều hướng Store.
 */
export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  // BẢO TỒN 100% TRẠNG THÁI TỪ STORE
  const { isInputFocused, setInputFocused } = useUiStore();

  return (
    <div className={`w-full transition-all duration-500 px-2`}>
      {!isInputFocused ? (
        /* [PHASE 3]: Trạng thái thu gọn - Chuyển sang phong cách Linear phẳng.
           Nền trắng tuyệt đối, border slate-200, bo góc 6px.
        */
        <button 
          onClick={(e) => {
            // [FIX]: Bảo tồn logic ngăn chặn nổi bọt để click không bị nuốt mất
            e.stopPropagation(); 
            onFocus();
          }}
          className="w-full text-left bg-white border border-slate-200 rounded-[6px] p-4 text-slate-400 text-sm cursor-pointer hover:border-slate-300 transition-all active:scale-[0.98] outline-none shadow-none"
        >
          Ghi lại điều bạn đang nghĩ...
        </button>
      ) : (
        /* [PHASE 3]: Trạng thái mở rộng - Sử dụng khung chứa Linear chuyên nghiệp.
           Loại bỏ shadow-2xl rườm rà, thay bằng border đặc slate-200.
        */
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-none animate-in zoom-in-95 duration-300 pointer-events-auto">
          <EntryForm 
            onSuccess={() => { 
              // BẢO TỒN 100% LOGIC SUCCESS
              setInputFocused(false); 
              onBlur(); 
            }}
            onCancel={() => { 
              // BẢO TỒN 100% LOGIC CANCEL
              setInputFocused(false); 
              onBlur(); 
            }}
          />
        </div>
      )}
    </div>
  );
};