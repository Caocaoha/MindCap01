import React, { useState } from 'react';
import { X, Plus, Clock, Calendar } from 'lucide-react';
import { useIdentityStore } from '../store';
import { IDENTITY_QUESTIONS } from '../data/questions';
import { IdentityOverlay } from './IdentityOverlay'; // Tái sử dụng form nhập liệu

interface MemoryRoomProps {
  questionId: number | null;
  onClose: () => void;
}

export const MemoryRoom: React.FC<MemoryRoomProps> = ({ questionId, onClose }) => {
  const { getHistory } = useIdentityStore();
  const [isWritingNew, setIsWritingNew] = useState(false);

  if (!questionId) return null;

  const question = IDENTITY_QUESTIONS.find((q) => q.id === questionId);
  const history = getHistory(questionId); // Đã được sort mới nhất lên đầu trong store

  if (!question) return null;

  return (
    <>
      {/* Overlay Room Container */}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in slide-in-from-bottom-10 duration-300">
        <div className="w-full max-w-4xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-mono text-indigo-400">HISTORY OF QUESTION {questionId}</span>
              <h2 className="text-xl md:text-2xl font-serif text-slate-100 leading-snug">
                {question.content}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWritingNew(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Viết tiếp</span>
              </button>
              
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body: Timeline Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-950/30">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 py-20">
                Chưa có ghi chép nào. Hãy bắt đầu viết.
              </div>
            ) : (
              history.map((entry, index) => (
                <div key={entry.id} className="relative pl-8 border-l border-slate-800 last:border-0">
                  {/* Timeline Node */}
                  <div className={`
                    absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full 
                    ${index === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}
                  `} />
                  
                  {/* Content Card */}
                  <div className={`
                    p-6 rounded-xl border 
                    ${index === 0 ? 'bg-slate-800/50 border-indigo-500/30' : 'bg-slate-900/30 border-slate-800'}
                  `}>
                    <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(entry.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">MỚI NHẤT</span>
                      )}
                    </div>

                    <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-sans">
                      {entry.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Write New Input Overlay */}
      {isWritingNew && (
        <IdentityOverlay 
          isOpen={true} 
          onClose={() => setIsWritingNew(false)} // Đóng input thì quay lại Room
          overrideQuestionId={questionId}
        />
      )}
    </>
  );
};