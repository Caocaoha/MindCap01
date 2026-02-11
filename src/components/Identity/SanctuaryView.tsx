// src/components/Identity/SanctuaryView.tsx
import React, { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { IDENTITY_QUESTIONS } from '../../modules/identity/data/questions';
import { Lock, FileText, Map } from 'lucide-react';
import clsx from 'clsx';

interface SanctuaryViewProps {
  onOpenAudit: () => void; // Callback mở lại Overlay nhập liệu
}

export const SanctuaryView: React.FC<SanctuaryViewProps> = ({ onOpenAudit }) => {
  const { identity } = useUserStore();
  const [activeTab, setActiveTab] = useState<'manifesto' | 'journey'>('manifesto');
  
  const answers = identity?.answers || {};
  const currentQId = identity?.currentQuestionId || 1;

  // Lọc các câu Manifesto (20-24)
  const manifestoQuestions = IDENTITY_QUESTIONS.filter(q => q.isManifesto);
  const isManifestoUnlocked = identity?.highestQuestionId >= 26; // Mở khóa khi xong câu 26? Hoặc khi xong chính câu đó.
  // Logic: Manifesto hiện ra dần dần hoặc đợi xong hết mới hiện. 
  // Theo spec: "Tab 1: Tổng thể... Trạng thái chưa hoàn thành: Toàn bộ vùng này bị phủ mờ."
  // Vậy ta check isCompleted.

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Sanctuary */}
      <div className="bg-slate-900 text-white p-6 pt-12 pb-8">
        <h1 className="text-3xl font-light text-center mb-2">Sanctuary</h1>
        <p className="text-slate-400 text-center text-sm uppercase tracking-widest">Thánh đường của Ngôi sao phương Bắc</p>
        
        {/* Tabs */}
        <div className="flex justify-center gap-6 mt-8">
          <button 
            onClick={() => setActiveTab('manifesto')}
            className={clsx("pb-2 text-sm font-bold border-b-2 transition-colors", 
              activeTab === 'manifesto' ? "border-white text-white" : "border-transparent text-slate-500 hover:text-slate-300")}
          >
            TUYÊN NGÔN
          </button>
          <button 
            onClick={() => setActiveTab('journey')}
            className={clsx("pb-2 text-sm font-bold border-b-2 transition-colors", 
              activeTab === 'journey' ? "border-white text-white" : "border-transparent text-slate-500 hover:text-slate-300")}
          >
            HÀNH TRÌNH
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* --- TAB 1: MANIFESTO --- */}
        {activeTab === 'manifesto' && (
          <div className="relative">
            {!isManifestoUnlocked && (
              <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                <Lock size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Bản Tuyên Ngôn Chưa Thành Hình</h3>
                <p className="text-slate-500 mb-6 max-w-md">Hãy hoàn thành hành trình để nhìn thấy Bản Tuyên Ngôn của chính mình.</p>
                <button onClick={onOpenAudit} className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                  Tiếp tục hành trình
                </button>
              </div>
            )}
            
            <div className="grid gap-6">
               {manifestoQuestions.map(q => {
                 const ans = answers[q.id]?.content || "---";
                 return (
                   <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                     <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                       {q.text.split(':')[0]} {/* Lấy tiêu đề ngắn gọn */}
                     </div>
                     <div className="text-lg font-serif italic text-slate-800">
                       "{ans}"
                     </div>
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        {/* --- TAB 2: JOURNEY --- */}
        {activeTab === 'journey' && (
          <div className="space-y-8 relative">
            {/* The Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 -z-10" />

            {IDENTITY_QUESTIONS.map((q, index) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = q.id === currentQId;
              const isFuture = q.id > currentQId;

              return (
                <div key={q.id} className={clsx("flex gap-4 relative", isFuture && "opacity-40 blur-[1px]")}>
                  {/* Status Node */}
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 bg-white z-10",
                    isAnswered ? "border-slate-900 text-slate-900" : 
                    isCurrent ? "border-blue-500 animate-pulse" : "border-slate-200"
                  )}>
                    {isAnswered && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
                  </div>

                  {/* Content */}
                  <div className="pb-8">
                    <div className="text-xs font-bold text-slate-400 mb-1">CÂU {q.id}</div>
                    <div className={clsx("text-base mb-2", isAnswered ? "font-bold text-slate-800" : "text-slate-600")}>
                       {q.text.replace(/\*\*/g, '')} {/* Remove markdown chars for cleaner view */}
                    </div>
                    
                    {isAnswered && (
                      <div className="bg-slate-100 p-3 rounded-lg text-slate-700 text-sm font-serif">
                        {answers[q.id].content}
                      </div>
                    )}

                    {isCurrent && (
                      <button onClick={onOpenAudit} className="mt-2 text-sm text-blue-600 font-bold hover:underline">
                        Trả lời ngay &rarr;
                      </button>
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