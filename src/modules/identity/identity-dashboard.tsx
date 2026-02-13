import React, { useState } from 'react';
import { useIdentityStore } from './identity-store';
import { IDENTITY_QUESTIONS, IDENTITY_STAGES } from './identity-constants';
import { triggerHaptic } from '../../utils/haptic';

export const IdentityDashboard: React.FC = () => {
  const { progress, openAudit } = useIdentityStore();
  const [activeTab, setActiveTab] = useState<'manifesto' | 'journey'>('journey');
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  return (
    <div className="h-full flex flex-col bg-black text-white select-none overflow-hidden animate-in fade-in duration-1000">
      
      {/* --- DASHBOARD HEADER: Đã loại bỏ mặt trời nội khu --- */}
      <header className="flex flex-col items-center pt-4 pb-4 border-b border-white/5 bg-zinc-950/20 backdrop-blur-md">
        <nav className="flex justify-center gap-12">
          {['manifesto', 'journey'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { triggerHaptic('light'); setActiveTab(tab as any); }}
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 
                ${activeTab === tab ? 'text-white border-b border-white pb-2' : 'opacity-20 hover:opacity-40'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar">
        {activeTab === 'journey' && (
          <div className="flex flex-col gap-10 pb-40">
            {IDENTITY_QUESTIONS.map((q, idx) => {
              const answers = progress.answers[q.id] || [];
              const isCleared = idx < progress.currentQuestionIndex;
              const isCurrent = idx === progress.currentQuestionIndex;
              
              // [CẬP NHẬT]: Chỉ hiện tối đa 2 câu chưa hoàn thành (Câu hiện tại + 1 câu sương mù)
              const isNext = idx === progress.currentQuestionIndex + 1;
              const isHidden = idx > progress.currentQuestionIndex + 1;

              if (isHidden) return null;

              const stageInfo = IDENTITY_STAGES[q.stage as keyof typeof IDENTITY_STAGES];

              return (
                <div 
                  key={q.id}
                  // Double click để vào audit trực tiếp
                  onDoubleClick={() => {
                    if (isCleared) setSelectedHistoryId(q.id);
                    else if (isCurrent) { triggerHaptic('medium'); openAudit(idx); }
                  }}
                  className={`group relative p-6 rounded-3xl transition-all duration-700 border border-white/5
                    ${isNext ? 'backdrop-blur-xl bg-white/5 opacity-30 pointer-events-none' : 'bg-zinc-900/40 opacity-100'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${stageInfo.color}`}>
                        {stageInfo.alias}
                      </span>
                      <span className="text-[10px] font-mono opacity-20">#{String(q.id).padStart(2, '0')}</span>
                    </div>
                    {isCleared && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); openAudit(idx); }}
                        className="text-[9px] font-bold text-blue-400 border border-blue-400/20 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Trả lời mới
                      </button>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-bold leading-relaxed">{q.text}</h4>
                  
                  {/* [BỔ SUNG]: Lời mời soi sáng cho câu hiện tại */}
                  {isCurrent && (
                    <div className="mt-4 flex items-center gap-3 text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Tâm trí đang đợi câu trả lời của bạn...
                    </div>
                  )}

                  {answers.length > 0 && (
                    <p className="mt-4 text-sm font-serif italic text-blue-100/50 line-clamp-2 border-l border-white/10 pl-4">
                      {answers[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB MANIFESTO */}
        {activeTab === 'manifesto' && (
          <div className="relative min-h-full">
            {!progress.isManifestoUnlocked && (
              <div className="absolute inset-0 z-10 backdrop-blur-2xl bg-black/60 flex flex-col items-center justify-center p-10 text-center rounded-3xl">
                <p className="text-sm font-serif italic text-zinc-500 mb-8 max-w-[240px]">
                  "Hoàn thành hành trình để diện kiến căn tính mới của bạn."
                </p>
                <button onClick={() => setActiveTab('journey')} className="px-8 py-3 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest">Tiếp tục hành trình</button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-8">
              {IDENTITY_QUESTIONS.filter(q => q.isManifesto).map(q => (
                <div key={q.id} className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-4 font-bold">{q.text}</p>
                  <p className="text-xl font-serif italic text-blue-50/90 leading-relaxed italic">
                    {(progress.answers[q.id] || [])[0] || "..."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- HISTORY DRAWER (Double Click cho câu cũ) --- */}
      {selectedHistoryId && (
        <div className="fixed inset-0 z-[120] bg-black/95 p-8 flex flex-col animate-in fade-in slide-in-from-right duration-500">
          <button onClick={() => setSelectedHistoryId(null)} className="absolute top-10 right-10 opacity-30 hover:opacity-100 uppercase text-[10px] tracking-widest font-black">Đóng</button>
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col pt-20">
            <h2 className="text-2xl font-serif italic mb-2 text-blue-100 italic">
              "{IDENTITY_QUESTIONS.find(q => q.id === selectedHistoryId)?.text}"
            </h2>
            <button onClick={() => { openAudit(IDENTITY_QUESTIONS.findIndex(q => q.id === selectedHistoryId)); setSelectedHistoryId(null); }}
              className="mt-8 mb-16 bg-blue-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em]">Cập nhật phản hồi mới</button>
            <div className="flex-1 overflow-y-auto space-y-16 pr-4 custom-scrollbar">
              {(progress.answers[selectedHistoryId] || []).map((text, i) => (
                <div key={i} className="border-l border-white/10 pl-8 relative">
                  <div className="absolute left-[-5px] top-3 w-2.5 h-2.5 rounded-full bg-blue-500/50" />
                  <span className="text-[9px] text-zinc-600 block mb-4 uppercase tracking-[0.2em] font-black">
                    {i === 0 ? "Bản ghi hiện tại" : `Bản ghi cũ #${(progress.answers[selectedHistoryId] || []).length - i}`}
                  </span>
                  <p className="text-xl font-serif text-blue-50/80 leading-relaxed italic">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};