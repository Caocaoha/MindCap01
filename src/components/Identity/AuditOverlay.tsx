// src/components/Identity/AuditOverlay.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Lock } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { IDENTITY_QUESTIONS } from '../../modules/identity/data/questions';

interface AuditOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditOverlay: React.FC<AuditOverlayProps> = ({ isOpen, onClose }) => {
  const { identity, submitIdentityAnswer } = useUserStore();
  const [text, setText] = useState('');
  
  // Xác định câu hỏi hiện tại
  const currentQId = identity?.currentQuestionId || 1;
  const question = IDENTITY_QUESTIONS.find(q => q.id === currentQId);
  const isCooldown = identity?.cooldownEndsAt && Date.now() < identity.cooldownEndsAt;

  // Load draft nếu có (từ answers đã lưu hoặc local state tạm - ở đây load từ answers cũ để sửa lại nếu cần, hoặc empty)
  useEffect(() => {
    if (isOpen) setText(''); // Reset text mỗi khi mở câu mới
  }, [currentQId, isOpen]);

  if (!isOpen || !question) return null;

  const handleSave = async () => {
    if (!text.trim()) return;
    await submitIdentityAnswer(currentQId, text);
    // Nếu bị cooldown sau khi save -> UI sẽ tự re-render state cooldown
  };

  // Cooldown View
  if (isCooldown) {
    const minutesLeft = Math.ceil((identity.cooldownEndsAt! - Date.now()) / 60000);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <Lock size={48} className="mb-4 text-slate-500" />
        <h2 className="text-xl font-bold mb-2 text-center">Bóng tối cần lắng xuống</h2>
        <p className="text-slate-400 text-center max-w-md">
          Hãy nghỉ ngơi. Ngôi sao sẽ sáng lại sau <span className="text-blue-400 font-bold">{minutesLeft} phút</span> nữa.
        </p>
        <button onClick={onClose} className="mt-8 px-6 py-2 border border-slate-700 rounded-full hover:bg-slate-800">
          Rời khỏi Thánh đường
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          Chặng {question.phase} / 5
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode='wait'>
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="text-2xl md:text-3xl font-light leading-relaxed mb-8 text-slate-200">
              {/* Parse Bold markdown thủ công hoặc dùng library. Ở đây render text raw nhưng highlight */}
              {question.text.split('**').map((part, i) => 
                i % 2 === 1 ? <span key={i} className="font-bold text-white">{part}</span> : part
              )}
            </h1>

            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Gõ để bắt đầu đối thoại với chính mình..."
              className="w-full bg-transparent border-none outline-none text-xl text-slate-300 placeholder:text-slate-700 resize-none h-48"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Action */}
      <div className="p-6 pb-10 flex justify-end max-w-2xl mx-auto w-full">
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-full font-bold hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span>Tiếp tục</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};