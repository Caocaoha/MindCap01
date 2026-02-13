import React from 'react';
import { useUserStore } from '../../../store/user-store';

export const UserIdentityProfile: React.FC = () => {
  const { currentLevel, eaScore, archetype } = useUserStore();
  
  // Giả sử mỗi level cần 100 điểm eaScore
  const progress = eaScore % 100;

  return (
    <section className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 shadow-inner mb-6">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black tracking-[0.3em] opacity-30 uppercase">
            {archetype.replace('-', ' ')}
          </h3>
          <div className="text-4xl font-serif italic text-white/90">
            Level {currentLevel}
          </div>
        </div>
        <div className="text-right space-y-2">
          <span className="text-[9px] font-bold opacity-20 tracking-widest uppercase">Action Energy (Ea)</span>
          <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};