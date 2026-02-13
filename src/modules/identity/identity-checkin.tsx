import React, { useEffect, useRef, useState } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS, IDENTITY_STAGES } from './identity-constants';
import { triggerHaptic } from '../../utils/haptic';

export const IdentityCheckin: React.FC = () => {
  const { isOpen, progress, submitAnswer, saveAndExit } = useIdentityStore();
  const [isFading, setIsFading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // LOGIC: Type-to-Focus & Shortcuts (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Shortcut Save (Cmd+S hoặc Ctrl+S)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleCommit();
        return;
      }

      // Type-to-Focus: Tự động focus khi gõ ký tự chữ/số
      if (document.activeElement !== textareaRef.current && e.key.length === 1) {
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, progress.currentQuestionIndex]);

  const handleCommit = async () => {
    const text = textareaRef.current?.value || '';
    if (!text.trim() || isFading) return;

    setIsFading(true);
    triggerHaptic('medium');

    // Hiệu ứng Tan sương mù (500ms) trước khi nạp câu mới
    setTimeout(async () => {
      await submitAnswer(text);
      if (textareaRef.current) textareaRef.current.value = '';
      setIsFading(false);
      // Tự động focus lại ô nhập cho câu tiếp theo
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 500);
  };

  if (!isOpen) return null;

  const currentQ = IDENTITY_QUESTIONS[progress.currentQuestionIndex];
  const stageInfo = IDENTITY_STAGES[currentQ?.stage as keyof typeof IDENTITY_STAGES];

  return (
    <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex flex-col p-10 md:p-24 animate-in fade-in duration-1000">
      
      {/* VÙNG NHẬP LIỆU: Hiệu ứng Tan sương khi chuyển cảnh */}
      <div className={`flex-1 flex flex-col max-w-3xl mx-auto w-full transition-all duration-700 
        ${isFading ? 'blur-3xl opacity-0 scale-90' : 'blur-none opacity-100 scale-100'}`}>
        
        <div className="flex items-center gap-4 mb-8">
          <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${stageInfo?.color}`}>
            {stageInfo?.name}
          </span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <h2 className="text-3xl md:text-5xl font-serif italic text-white mb-20 leading-tight">
          "{currentQ?.text}"
        </h2>
        
        <textarea
          ref={textareaRef}
          autoFocus
          defaultValue={progress.draftAnswer}
          className="w-full flex-1 bg-transparent text-2xl md:text-4xl text-blue-100/90 font-serif italic outline-none resize-none leading-relaxed custom-scrollbar"
          placeholder="Viết xuống sự thật của bạn..."
        />
      </div>

      {/* FOOTER ĐIỀU KHIỂN */}
      <footer className="h-24 flex justify-between items-center max-w-3xl mx-auto w-full border-t border-white/5 mt-10">
        <button 
          onClick={() => saveAndExit(textareaRef.current?.value || '')} 
          className="text-[10px] font-black opacity-30 hover:opacity-100 uppercase tracking-widest transition-opacity"
        >
          Tạm dừng & Lưu nháp
        </button>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end opacity-20">
            <span className="text-[8px] font-black uppercase tracking-widest">Lối tắt ghi nhận</span>
            <span className="text-[10px] font-mono">CMD + S</span>
          </div>
          <button 
            onClick={handleCommit} 
            className="bg-white text-black px-12 py-4 rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-90"
          >
            Ghi nhận
          </button>
        </div>
      </footer>
    </div>
  );
};