import React, { useState, useEffect } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { SunCompass } from './components/sun-compass';

export const IdentityCheckin: React.FC = () => {
  const { isOpen, progress, submitAnswer, saveAndExit, closeAudit, initStore } = useIdentityStore();
  const [localAnswer, setLocalAnswer] = useState('');

  useEffect(() => { initStore(); }, []);
  useEffect(() => { setLocalAnswer(progress.draftAnswer || ''); }, [progress.currentQuestionIndex]);

  if (!isOpen) return <SunCompass status={progress.lastStatus} />;

  const currentQ = IDENTITY_QUESTIONS[progress.currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-8 animate-in fade-in duration-700">
      {/* Header của Overlay */}
      <div className="flex justify-between items-center mb-20">
        <div className="text-[10px] tracking-[0.4em] opacity-30 uppercase">
          Stage {currentQ?.stage} / 5 — Identity Audit
        </div>
        <button onClick={() => saveAndExit(localAnswer)} className="text-xs opacity-50 hover:opacity-100">
          LƯU & THOÁT
        </button>
      </div>

      {/* Vùng nội dung câu hỏi */}
      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <h2 className="text-2xl md:text-3xl font-serif italic mb-8 leading-tight text-orange-50/90">
          "{currentQ?.text}"
        </h2>
        
        <textarea
          autoFocus
          value={localAnswer}
          onChange={(e) => setLocalAnswer(e.target.value)}
          placeholder="Thành thật với chính mình..."
          className="w-full bg-transparent border-l border-white/10 pl-6 py-2 text-xl focus:outline-none focus:border-blue-500 transition-colors min-h-[200px]"
        />

        <div className="mt-12 flex justify-end">
          <button 
            onClick={() => submitAnswer(localAnswer)}
            disabled={!localAnswer.trim()}
            className="group flex items-center gap-4 text-blue-500 disabled:opacity-20 transition-all"
          >
            <span className="text-xs font-black tracking-widest uppercase">Tiếp theo</span>
            <div className="w-12 h-[1px] bg-blue-500 group-hover:w-20 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};