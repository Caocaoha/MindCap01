import React, { useState } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

export const BookmarkReasonModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: (reason: string) => void }> = ({ isOpen, onClose, onConfirm }) => {
  const [val, setVal] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-yellow-500 text-[10px] font-black tracking-[0.3em] uppercase mb-2">Gieo hạt ký ức</h3>
        <p className="text-white/40 text-xs mb-6">Tại sao bạn muốn giữ lại khoảnh khắc này?</p>
        <textarea 
          autoFocus
          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-yellow-500/40 min-h-[100px] mb-6"
          placeholder="Lý do đánh dấu..."
          onChange={(e) => setVal(e.target.value)}
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-bold uppercase opacity-30">Hủy</button>
          <button 
            onClick={() => { triggerHaptic('success'); onConfirm(val); setVal(''); }}
            className="flex-1 bg-yellow-500 text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest"
          >
            Lưu giữ
          </button>
        </div>
      </div>
    </div>
  );
};