import React, { useState, useEffect, useRef } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { IdentityDashboard } from './identity-dashboard';
import { triggerHaptic } from '../../utils/haptic';

export const IdentityCheckin: React.FC = () => {
  const { isOpen, progress, submitAnswer, saveAndExit, initStore } = useIdentityStore();
  const [localAnswer, setLocalAnswer] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false); // [NEW]: Trạng thái Tan sương
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { initStore(); }, [initStore]);

  useEffect(() => {
    setLocalAnswer(progress.draftAnswer || '');
  }, [progress.currentQuestionIndex, progress.draftAnswer]);

  if (!isOpen) return <IdentityDashboard />;

  const currentQ = IDENTITY_QUESTIONS[progress.currentQuestionIndex];

  /**
   * PHƯƠNG ÁN "TAN SƯƠNG" (The Fog Dissolve Flow)
   * Chia hành động chuyển câu hỏi thành 3 giai đoạn điện ảnh
   */
  const handleNextWithFog = async () => {
    if (!localAnswer.trim() || isTransitioning) return;

    // Giai đoạn A: BỐC HƠI (Evaporation) - 500ms
    setIsTransitioning(true);
    triggerHaptic('light');

    setTimeout(async () => {
      // Giai đoạn B: KHOẢNG LẶNG (The Void) - 200ms
      // Cập nhật dữ liệu vào Store khi màn hình đã mờ hẳn
      await submitAnswer(localAnswer);
      setLocalAnswer('');

      setTimeout(() => {
        // Giai đoạn C: NGƯNG TỤ (Condensation) - 800ms
        setIsTransitioning(false);
        triggerHaptic('medium');
        
        // Tự động focus lại vào ô nhập liệu sau khi sương đã tan
        setTimeout(() => textareaRef.current?.focus(), 100);
      }, 200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col p-6 md:p-12 animate-in fade-in duration-1000">
      
      {/* Header logic progress */}
      <header className={`flex justify-between items-center mb-16 transition-opacity duration-700 ${isTransitioning ? 'opacity-20' : 'opacity-100'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase">Stage {currentQ?.stage} / 5</span>
          <div className="h-[2px] w-32 bg-white/10 mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-1000"
              style={{ width: `${(progress.currentQuestionIndex / IDENTITY_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <button onClick={() => saveAndExit(localAnswer)} className="text-[9px] font-black opacity-40 hover:opacity-100 uppercase border border-white/10 px-6 py-2 rounded-full">
          Lưu nháp
        </button>
      </header>

      {/* Vùng Tan sương mù chính */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <div className={`
          transition-all duration-[800ms] ease-in-out
          ${isTransitioning ? 'blur-2xl opacity-0 scale-95' : 'blur-none opacity-100 scale-100'}
        `}>
          <div className="mb-4 opacity-20 text-[10px] font-bold tracking-widest uppercase">Câu {currentQ?.id}</div>
          <h2 className="text-2xl md:text-4xl font-serif italic mb-10 text-zinc-100 leading-tight">"{currentQ?.text}"</h2>
          
          <textarea
            ref={textareaRef}
            autoFocus
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            disabled={isTransitioning}
            className="w-full bg-transparent border-l-2 border-white/10 pl-8 py-4 text-xl md:text-2xl text-blue-100/90 focus:outline-none focus:border-blue-500 min-h-[300px]"
            placeholder="Thành thật với chính mình..."
          />
        </div>

        {/* Nút Ghi nhận (Tàng hình khi đang chuyển cảnh) */}
        <div className={`mt-12 flex justify-end transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <button onClick={handleNextWithFog} disabled={!localAnswer.trim()} className="group flex items-center gap-6 text-blue-500 disabled:opacity-10">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase">Ghi nhận</span>
            <div className="w-14 h-14 rounded-full border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-all">
              →
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};