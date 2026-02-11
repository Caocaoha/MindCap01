import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useIdentityStore } from '../store';
import { IDENTITY_QUESTIONS } from '../data/questions';

interface IdentityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  overrideQuestionId?: number | null; // Dùng khi muốn edit lại 1 câu cụ thể
}

export const IdentityOverlay: React.FC<IdentityOverlayProps> = ({ isOpen, onClose, overrideQuestionId }) => {
  const { currentQuestionIndex, submitAnswer, latestAnswers } = useIdentityStore();
  
  // Xác định câu hỏi đang hiển thị
  // Nếu có overrideId (sửa lại) thì dùng nó, không thì dùng index hiện tại (onboarding)
  const activeQuestionId = overrideQuestionId 
    ? overrideQuestionId 
    : IDENTITY_QUESTIONS[currentQuestionIndex]?.id;

  const activeQuestion = IDENTITY_QUESTIONS.find(q => q.id === activeQuestionId);
  
  const [answer, setAnswer] = useState('');

  // Load câu trả lời cũ nếu có (để sửa)
  useEffect(() => {
    if (activeQuestionId && latestAnswers[activeQuestionId]) {
      setAnswer(latestAnswers[activeQuestionId].content);
    } else {
      setAnswer('');
    }
  }, [activeQuestionId, latestAnswers, isOpen]);

  const handleSave = () => {
    if (!activeQuestion || !answer.trim()) return;
    submitAnswer(activeQuestion.id, answer);
    setAnswer('');
    
    // Nếu đang sửa lại thì đóng luôn
    if (overrideQuestionId) {
      onClose();
    }
  };

  if (!isOpen || !activeQuestion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-2xl p-6 md:p-12 animate-in fade-in zoom-in duration-300">
        
        {/* Header: Exit */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">
              Câu hỏi {activeQuestion.id} / 25
            </span>
            <h2 className="text-2xl md:text-3xl font-serif text-slate-100 leading-relaxed">
              {activeQuestion.content}
            </h2>
            {activeQuestion.helperText && (
              <p className="text-sm text-slate-400 italic mt-2">
                * {activeQuestion.helperText}
              </p>
            )}
          </div>

          <textarea
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Viết xuống suy nghĩ của bạn..."
            className="w-full h-48 bg-transparent border-b border-slate-700 text-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors font-sans"
          />

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={!answer.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Lưu lại</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};