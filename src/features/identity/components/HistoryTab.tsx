import React from 'react';
import { useIdentityStore } from '../store';
import { IDENTITY_QUESTIONS } from '../data/questions';
import { Clock, ChevronRight } from 'lucide-react';

interface HistoryTabProps {
  onOpenQuestion: (questionId: number) => void; // Callback để mở Memory Room
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onOpenQuestion }) => {
  const { latestAnswers } = useIdentityStore();

  return (
    <div className="space-y-1 p-4 pb-20">
      {IDENTITY_QUESTIONS.map((q) => {
        const answer = latestAnswers[q.id];
        
        return (
          <div 
            key={q.id}
            onClick={() => answer && onOpenQuestion(q.id)}
            className={`
              group relative p-4 rounded-lg border border-transparent
              ${answer 
                ? 'hover:bg-slate-800/50 hover:border-slate-700 cursor-pointer' 
                : 'opacity-50 grayscale cursor-default'}
              transition-all duration-200
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Q{q.id}.</span>
                  <h4 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                    {q.content}
                  </h4>
                </div>
                
                {answer ? (
                  <p className="text-sm text-slate-400 line-clamp-2 pl-6 border-l-2 border-slate-700">
                    {answer.content}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 pl-6 italic">Chưa mở khóa</p>
                )}
              </div>

              {answer && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            {answer && (
              <div className="mt-3 pl-6 flex items-center gap-2 text-[10px] text-slate-600">
                <Clock className="w-3 h-3" />
                <span>Cập nhật: {new Date(answer.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};