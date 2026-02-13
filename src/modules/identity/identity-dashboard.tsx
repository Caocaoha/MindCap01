import React, { useState } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { triggerHaptic } from '../../utils/haptic';
// Thêm SunCompass vào import
import { SunCompass } from './components/sun-compass';

export const IdentityDashboard: React.FC = () => {
  const { progress, openAudit, checkCooldown } = useIdentityStore();
  const [activeTab, setActiveTab] = useState<'manifesto' | 'journey'>('journey');

  // Lọc 5 câu hỏi cốt lõi cho Manifesto
  const manifestoQuestions = IDENTITY_QUESTIONS.filter(q => q.isManifesto);

  // Xử lý khi click vào vùng bị mù (The Fog)
  const handleFogInteraction = () => {
    if (checkCooldown()) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('light');
    openAudit();
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden animate-in fade-in duration-700">
      
      {/* --- TAB SWITCHER --- */}
      <nav className="flex justify-center gap-8 mb-8 mt-4 relative z-20">
        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('manifesto'); }}
          className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'manifesto' ? 'text-white border-b border-white pb-1' : 'opacity-20'}`}
        >
          The Manifesto
        </button>
        <button 
          onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }}
          className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'journey' ? 'text-white border-b border-white pb-1' : 'opacity-20'}`}
        >
          The Journey
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        
        {/* --- TAB 1: THE MANIFESTO --- */}
        {activeTab === 'manifesto' && (
          <div className="relative min-h-[400px]">
            {/* Lớp mù Manifesto nếu chưa hoàn thành */}
            {!progress.isManifestoUnlocked && (
              <div className="absolute inset-0 z-30 backdrop-blur-xl bg-black/40 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/5">
                <p className="text-sm font-serif italic text-zinc-400 mb-6 max-w-[200px]">
                  "Hãy hoàn thành hành trình để nhìn thấy Bản Tuyên Ngôn của chính mình."
                </p>
                <button 
                  onClick={() => setActiveTab('journey')}
                  className="px-6 py-2 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Tiếp tục hành trình
                </button>
              </div>
            )}

            {/* Grid 5 thẻ bài */}
            <div className="grid grid-cols-1 gap-6">
              {manifestoQuestions.map((q) => (
                <div key={q.id} className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                  <span className="text-[8px] font-black opacity-20 uppercase tracking-tighter">Câu hỏi {q.id}</span>
                  <p className="text-[10px] text-zinc-500 mb-3 uppercase tracking-widest">{q.text}</p>
                  <p className="text-lg font-serif italic text-blue-100/90 leading-relaxed">
                    {progress.answers[q.id] || "..."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: THE JOURNEY (Timeline) --- */}
        {activeTab === 'journey' && (
          <div className="flex flex-col gap-12 relative border-l border-white/5 ml-2 pl-8 py-4">
            {IDENTITY_QUESTIONS.map((q, index) => {
              const isCleared = index < progress.currentQuestionIndex;
              const isCurrent = index === progress.currentQuestionIndex;
              const isFoggy = index >= progress.currentQuestionIndex;

              return (
                <div 
                  key={q.id} 
                  className={`relative group transition-all duration-500 ${isFoggy ? 'cursor-pointer' : ''}`}
                  onClick={isFoggy ? handleFogInteraction : undefined}
                >
                  {/* Dot trên Timeline */}
                  <div className={`absolute -left-[37px] top-1.5 w-4 h-4 rounded-full border-2 transition-all 
                    ${isCleared ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                      isCurrent ? 'bg-black border-white animate-pulse' : 'bg-black border-white/20'}`} 
                  />

                  {/* Nội dung câu hỏi và lớp mù (The Fog) */}
                  <div className={`transition-all duration-700 ${isFoggy ? 'backdrop-blur-md bg-white/[0.02] p-4 rounded-2xl border border-white/5' : ''}`}>
                    <h4 className={`text-xs uppercase tracking-widest mb-2 ${isCleared ? 'text-white font-bold' : 'text-zinc-500'}`}>
                      Câu {q.id}: {q.text}
                    </h4>
                    
                    {isCleared && (
                      <p className="text-sm font-serif italic text-blue-200/40 border-l border-white/10 pl-4 py-1">
                        {progress.answers[q.id]}
                      </p>
                    )}

                    {isCurrent && (
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                        Đang chờ phản hồi...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};