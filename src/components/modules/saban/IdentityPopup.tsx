// src/components/modules/saban/IdentityPopup.tsx
import React from 'react';
import { motion } from 'framer-motion';

export const IdentityPopup = ({ task, onConfirm, onCancel }: any) => {
  const scores = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <p className="text-xs text-blue-500 font-bold mb-2 uppercase tracking-widest text-center">Identity Alignment</p>
        <h3 className="text-slate-800 text-lg font-semibold text-center mb-6 italic">
          "Việc này ảnh hưởng thế nào đến căn tính của bạn?"
        </h3>
        
        <div className="grid grid-cols-4 gap-2 mb-8">
          {scores.map(s => (
            <button
              key={s}
              onClick={() => onConfirm(s)}
              className={`py-3 rounded-lg font-bold transition-all ${
                s > 0 ? 'bg-green-50 text-green-600 hover:bg-green-100' : 
                s < 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-50 text-slate-600'
              }`}
            >
              {s > 0 ? `+${s}` : s}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 text-slate-400 font-medium">Hủy chọn</button>
        </div>
      </motion.div>
    </div>
  );
};