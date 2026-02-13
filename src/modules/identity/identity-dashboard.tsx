import React, { useState } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS } from './identity-constants';
import { SunCompass } from './components/sun-compass';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [MOD_IDENTITY]: IdentityDashboard
 * Giao diện điều phối 2 Tab: The Manifesto (Tổng thể) và The Journey (Chi tiết)
 * Tích hợp hiệu ứng "The Fog" và cơ chế Tan mờ (Fog Dissolve).
 */
export const IdentityDashboard: React.FC = () => {
  const { progress, openAudit, checkCooldown } = useIdentityStore();
  const [activeTab, setActiveTab] = useState<'manifesto' | 'journey'>('journey');

  // Lọc 5 câu hỏi cốt lõi cho Manifesto (Câu 20-24)
  const manifestoQuestions = IDENTITY_QUESTIONS.filter(q => q.isManifesto);

  // Xử lý tương tác với vùng mù hoặc câu hiện tại
  const handleInteraction = () => {
    if (checkCooldown()) {
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('light');
    openAudit();
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden animate-in fade-in duration-700">
      
      {/* --- HEADER DASHBOARD: SunCompass & Tab Switcher --- */}
      <header className="flex flex-col items-center pt-8 pb-4 border-b border-white/5 bg-zinc-950/30 backdrop-blur-md relative z-40">
        <div className="mb-6 scale-125 hover:scale-110 transition-transform duration-500">
          <SunCompass status={progress.lastStatus} />
        </div>
        
        <nav className="flex justify-center gap-12 relative">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('manifesto'); }}
            className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
              activeTab === 'manifesto' ? 'text-white border-b border-white pb-2' : 'opacity-20 hover:opacity-50'
            }`}
          >
            The Manifesto
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('journey'); }}
            className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${
              activeTab === 'journey' ? 'text-white border-b border-white pb-2' : 'opacity-20 hover:opacity-50'
            }`}
          >
            The Journey
          </button>
        </nav>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 pt-8">
        
        {/* TAB 1: THE MANIFESTO (Tổng thể) */}
        {activeTab === 'manifesto' && (
          <div className="relative min-h-[500px] animate-in slide-in-from-right duration-700">
            {/* Overlay nếu chưa mở khóa Manifesto */}
            {!progress.isManifestoUnlocked && (
              <div className="absolute inset-0 z-30 backdrop-blur-2xl bg-black/60 flex flex-col items-center justify-center text-center p-10 rounded-3xl border border-white/5 shadow-2xl">
                <p className="text-sm font-serif italic text-zinc-400 mb-8 max-w-[240px] leading-relaxed">
                  "Hãy hoàn thành hành trình để nhìn thấy Bản Tuyên Ngôn của chính mình."
                </p>
                <button 
                  onClick={() => { triggerHaptic('medium'); setActiveTab('journey'); }}
                  className="px-8 py-3 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95"
                >
                  Tiếp tục hành trình
                </button>
              </div>
            )}

            {/* Danh sách 5 thẻ bài căn tính */}
            <div className="grid grid-cols-1 gap-8">
              {manifestoQuestions.map((q) => (
                <div key={q.id} className="p-8 rounded-3xl bg-zinc-900/20 border border-white/5 group hover:border-blue-500/20 transition-colors duration-500">
                  <span className="text-[8px] font-black opacity-10 uppercase tracking-tighter block mb-2">Manifesto Point {q.id}</span>
                  <p className="text-[9px] text-zinc-500 mb-4 uppercase tracking-[0.2em] font-bold">{q.text}</p>
                  <p className="text-xl md:text-2xl font-serif italic text-blue-50/90 leading-tight">
                    {progress.answers[q.id] || "..."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: THE JOURNEY (Timeline Lớp mù) */}
        {activeTab === 'journey' && (
          <div className="flex flex-col gap-14 relative border-l border-white/5 ml-3 pl-10 py-6 animate-in slide-in-from-left duration-700">
            
            {/* Đường dẫn tiến trình (Active Path Indicator) */}
            <div 
              className="absolute left-[-1px] top-0 bg-blue-500 transition-all duration-[2000ms] ease-in-out shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              style={{ 
                height: `${(progress.currentQuestionIndex / IDENTITY_QUESTIONS.length) * 100}%`, 
                width: '2px' 
              }}
            />

            {IDENTITY_QUESTIONS.map((q, index) => {
              const isCleared = index < progress.currentQuestionIndex;
              const isCurrent = index === progress.currentQuestionIndex;
              const isFoggy = index > progress.currentQuestionIndex;

              return (
                <div 
                  key={q.id} 
                  className={`relative group transition-all duration-[1000ms] ease-in-out ${isFoggy || isCurrent ? 'cursor-pointer' : ''}`}
                  onClick={isFoggy || isCurrent ? handleInteraction : undefined}
                >
                  {/* Dot Timeline (Điểm nút) */}
                  <div className={`absolute -left-[49px] top-1.5 w-4.5 h-4.5 rounded-full border-2 transition-all duration-[1000ms] z-10
                    ${isCleared ? 'bg-blue-500 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)] scale-75' : 
                      isCurrent ? 'bg-white border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse' : 
                      'bg-black border-white/20 scale-100 opacity-30'}`} 
                  />

                  {/* VỎ BỌC DISSOLVE (Hiệu ứng Tan mờ) */}
                  <div className={`
                    transition-all duration-[1500ms] ease-in-out rounded-3xl p-6 border
                    ${isCleared ? 'backdrop-blur-none bg-transparent border-transparent' : 
                      isCurrent ? 'backdrop-blur-sm bg-blue-500/5 border-blue-500/20 shadow-inner' : 
                      'backdrop-blur-md bg-white/[0.02] border-white/5 opacity-40'}
                  `}>
                    {/* Header: ID & Question Text */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`text-[10px] font-black font-mono transition-colors duration-1000 ${isCleared ? 'text-blue-500' : 'text-zinc-700'}`}>
                        {String(q.id).padStart(2, '0')}
                      </span>
                      <h4 className={`text-xs uppercase tracking-[0.2em] leading-relaxed transition-all duration-1000 ${
                        isCleared ? 'text-white/60 font-medium' : isCurrent ? 'text-white font-bold' : 'text-zinc-600'
                      }`}>
                        {q.text}
                      </h4>
                    </div>
                    
                    {/* Answer: Reveal effect (Chỉ hiện khi đã rõ nét) */}
                    {isCleared && (
                      <div className="animate-in fade-in slide-in-from-left duration-[1000ms]">
                        <p className="text-base font-serif italic text-blue-100/30 leading-relaxed pl-5 border-l border-blue-500/10">
                          {progress.answers[q.id]}
                        </p>
                      </div>
                    )}

                    {/* Current Step Indicator (Điểm chờ) */}
                    {isCurrent && (
                      <div className="flex items-center gap-3 mt-6 text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                        Chạm để soi sáng
                      </div>
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