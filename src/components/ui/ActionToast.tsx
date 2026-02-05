import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, Pencil, X } from 'lucide-react';

interface ActionToastProps {
  message: string;
  onUndo: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const ActionToast: React.FC<ActionToastProps> = ({ message, onUndo, onEdit, onClose }) => {
  // Tự động đóng sau 5 giây (đủ lâu để kịp bấm nút)
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col gap-3"
    >
      {/* Dòng 1: Thông báo */}
      <div className="flex items-start gap-3">
        <div className="bg-green-500/20 p-1 rounded-full text-green-400 mt-0.5">
          <CheckCircle2 size={16} />
        </div>
        <p className="text-sm font-medium leading-snug flex-1">{message}</p>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Dòng 2: Action Buttons */}
      <div className="flex gap-2 pl-9">
        <button 
          onClick={onEdit}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Pencil size={12} /> Sửa nhanh
        </button>
        <button 
          onClick={onUndo}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={12} /> Hoàn tác
        </button>
      </div>
    </motion.div>
  );
};

export default ActionToast;