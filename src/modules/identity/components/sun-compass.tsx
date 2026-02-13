import React from 'react';
import { useIdentityStore } from '../identity-store';
import { triggerHaptic } from '../../../utils/haptic';

export const SunCompass: React.FC = () => {
  const { progress, openAudit, getPulseFrequency } = useIdentityStore();
  
  // Lấy tần số nhịp thở dựa trên trạng thái (100s, 40s, 80s)
  const frequency = getPulseFrequency();

  const handleAction = () => {
    triggerHaptic('light');
    openAudit();
  };

  return (
    <button 
      onClick={handleAction} 
      style={{ '--pulse-duration': `${frequency}s` } as React.CSSProperties}
      className={`transition-all duration-700 outline-none relative group
        ${progress.lastStatus === 'cooldown' ? 'opacity-40 grayscale animate-spin-slow' : 'animate-pulse-custom'}`}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
           className={progress.lastStatus === 'enlightened' ? 'text-yellow-500 drop-shadow-sun' : 'text-white/40'}>
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    </button>
  );
};