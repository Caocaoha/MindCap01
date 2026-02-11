// src/modules/saban/components/IdentityImpactModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Task } from '../../../database/types';

interface IdentityImpactModalProps {
  task: Task | null;
  onClose: () => void;
  onConfirm: (score: number) => void;
}

export const IdentityImpactModal: React.FC<IdentityImpactModalProps> = ({ task, onClose, onConfirm }) => {
  const [score, setScore] = useState(0);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white"
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-light">Tác động Căn tính</h3>
          <button onClick={onClose}><X className="text-slate-500 hover:text-white" /></button>
        </div>

        <p className="text-slate-400 text-sm mb-2">Việc này ảnh hưởng thế nào đến con người bạn muốn trở thành?</p>
        <div className="text-xl font-bold text-white mb-8">"{task.content}"</div>

        {/* Slider UI Demo - Using Buttons for precision */}
        <div className="flex justify-between items-center mb-8 bg-slate-800 p-2 rounded-xl">
          <button onClick={() => setScore(Math.max(-5, score - 1))} className="w-10 h-10 bg-slate-700 rounded-lg text-red-400 font-bold">-</button>
          <div className="text-2xl font-bold w-12 text-center text-blue-400">{score > 0 ? `+${score}` : score}</div>
          <button onClick={() => setScore(Math.min(5, score + 1))} className="w-10 h-10 bg-slate-700 rounded-lg text-green-400 font-bold">+</button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800">
            Hủy
          </button>
          <button 
            onClick={() => onConfirm(score)}
            className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white flex justify-center items-center gap-2"
          >
            <Check size={18} /> Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  );
};