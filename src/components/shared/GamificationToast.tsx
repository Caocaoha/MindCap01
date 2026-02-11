// src/components/shared/GamificationToast.tsx
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  earnedXP: number;
  isLevelUp: boolean;
  onClose: () => void;
}

export const GamificationToast: React.FC<ToastProps> = ({ message, earnedXP, isLevelUp, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-3 
        ${isLevelUp ? 'bg-yellow-400 text-black' : 'bg-slate-800 text-white'}`}>
        
        {isLevelUp ? '🎊 LEVEL UP! 🎊' : '✨'}
        <span className="font-bold">{message} (+{earnedXP} XP)</span>
        
        {isLevelUp && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
            {/* Giả lập hiệu ứng lấp lánh nhẹ */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </div>
  );
};