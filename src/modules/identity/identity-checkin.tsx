import React, { useState, useEffect } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { SunCompass } from './components/sun-compass';
import { triggerHaptic } from '../../utils/haptic';

// QUAN TRỌNG: Phải có từ khóa 'export' ở đây
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

  if (!isOpen) {
    return <SunCompass status={progress.lastStatus} />;
  }

  const currentQ = IDENTITY_QUESTIONS[progress.currentQuestionIndex];

  const handleNext = async () => {
    if (!localAnswer.trim()) return;
    await submitAnswer(localAnswer);
    setLocalAnswer('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col p-6 md:p-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-16">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.4em] opacity-30 uppercase">
            Stage {currentQ?.stage} / 5
          </span>
          <div className="h-[1px] w-32 bg-white/10 mt-2">
            <div 
              className="h-full bg-blue-500 transition-all duration-700"
              style={{ width: `${(progress.currentQuestionIndex / IDENTITY_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <button onClick={() => saveAndExit(localAnswer)} className="text-[10px] font-bold opacity-40 hover:opacity-100 uppercase border border-white/10 px-4 py-2 rounded-full">
          Lưu & Thoát
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <h2 className="text-2xl md:text-4xl font-serif italic mb-10 text-zinc-100">"{currentQ?.text}"</h2>
        <textarea
          autoFocus
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          className="w-full bg-transparent border-l-2 border-white/5 pl-6 py-4 text-xl md:text-2xl text-blue-100/80 focus:outline-none focus:border-blue-500 min-h-[250px]"
          placeholder="Thành thật với chính mình..."
        />
        <div className="mt-12 flex justify-end">
          <button onClick={handleNext} disabled={!localAnswer.trim()} className="group flex items-center gap-4 text-blue-500 disabled:opacity-10">
            <span className="text-xs font-black tracking-widest uppercase">Ghi nhận</span>
            <div className="w-12 h-12 rounded-full border border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-black transition-all">→</div>
          </button>
        </div>
      </div>
    </div>
  );
};