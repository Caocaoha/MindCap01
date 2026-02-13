import React, { useState, useEffect } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { IdentityDashboard } from './identity-dashboard'; // Import Dashboard mới
import { triggerHaptic } from '../../utils/haptic';

export const IdentityCheckin: React.FC = () => {
  const { 
    isOpen, 
    progress, 
    submitAnswer, 
    saveAndExit, 
    initStore 
  } = useIdentityStore();

  const [localAnswer, setLocalAnswer] = useState('');

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    setLocalAnswer(progress.draftAnswer || '');
  }, [progress.currentQuestionIndex, progress.draftAnswer]);

  // --- THAY ĐỔI QUAN TRỌNG ---
  // Nếu không mở Overlay nhập liệu, hiển thị Dashboard 2 Tab
  if (!isOpen) {
    return <IdentityDashboard />;
  }

  // --- PHẦN DƯỚI LÀ OVERLAY NHẬP LIỆU (IMMERSIVE AUDIT) ---
  const currentQ = IDENTITY_QUESTIONS[progress.currentQuestionIndex];

  const handleNext = async () => {
    if (!localAnswer.trim()) return;
    await submitAnswer(localAnswer);
    setLocalAnswer('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col p-6 md:p-12 animate-in slide-in-from-bottom duration-500">
      {/* Header của Overlay */}
      <header className="flex justify-between items-center mb-16">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase">
            Giai đoạn {currentQ?.stage} / 5
          </span>
          <div className="h-[2px] w-32 bg-white/10 mt-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-1000 ease-out"
              style={{ width: `${(progress.currentQuestionIndex / IDENTITY_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <button 
          onClick={() => { triggerHaptic('medium'); saveAndExit(localAnswer); }} 
          className="text-[9px] font-black opacity-40 hover:opacity-100 uppercase border border-white/10 px-6 py-2 rounded-full transition-all"
        >
          Tạm dừng & Lưu
        </button>
      </header>

      {/* Vùng nhập liệu chính */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <div className="mb-4 opacity-20 text-[10px] font-bold tracking-widest uppercase">
          Câu hỏi {currentQ?.id} / {IDENTITY_QUESTIONS.length}
        </div>
        <h2 className="text-2xl md:text-4xl font-serif italic mb-10 text-zinc-100 leading-tight">
          "{currentQ?.text}"
        </h2>
        
        <textarea
          autoFocus
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          className="w-full bg-transparent border-l-2 border-white/10 pl-8 py-4 text-xl md:text-2xl text-blue-100/90 focus:outline-none focus:border-blue-500 min-h-[300px] transition-colors"
          placeholder="Thành thật với chính mình..."
        />

        <div className="mt-12 flex justify-end">
          <button 
            onClick={handleNext} 
            disabled={!localAnswer.trim()} 
            className="group flex items-center gap-6 text-blue-500 disabled:opacity-10 transition-all"
          >
            <span className="text-[10px] font-black tracking-[0.3em] uppercase group-hover:mr-2 transition-all">Ghi nhận</span>
            <div className="w-14 h-14 rounded-full border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-all shadow-lg shadow-blue-500/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};