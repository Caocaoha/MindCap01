// src/components/Input/ActionToast.tsx
import React, { useEffect } from 'react';
import { RotateCcw, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionToastProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ 
  visible, message, onUndo, onEdit, onClose 
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 5000); // Auto hide 5s
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-50 flex items-center gap-3 px-4 py-3 
                     bg-slate-900 text-white rounded-full shadow-lg border border-slate-700"
        >
          <span className="text-sm font-medium">{message}</span>
          
          <div className="h-4 w-px bg-slate-600 mx-1" />
          
          <button onClick={onUndo} className="p-1 hover:text-red-400 transition-colors">
            <RotateCcw size={18} />
          </button>
          
          <button onClick={onEdit} className="p-1 hover:text-blue-400 transition-colors">
            <Edit2 size={18} />
          </button>
          
          <button onClick={onClose} className="ml-1 p-1 text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};