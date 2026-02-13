import React from 'react';
import { useUiStore } from '../../store/ui-store';
import { EntryForm } from './components/entry-form';

interface InputBarProps {
  onFocus: () => void;
  onBlur: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({ onFocus, onBlur }) => {
  const { isInputFocused, setInputFocused } = useUiStore();

  return (
    <div className={`w-full transition-all duration-500 px-2`}>
      {!isInputFocused ? (
        /* Trạng thái thu gọn khi chưa Focus */
        <div 
          onClick={onFocus}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-4 text-white/20 text-sm cursor-pointer hover:border-white/10 transition-all"
        >
          Ghi lại điều bạn đang nghĩ...
        </div>
      ) : (
        /* Sử dụng EntryForm vạn năng khi đã Focus] */
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <EntryForm 
            onSuccess={() => { setInputFocused(false); onBlur(); }}
            onCancel={() => { setInputFocused(false); onBlur(); }}
          />
        </div>
      )}
    </div>
  );
};