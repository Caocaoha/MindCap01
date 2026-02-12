import React, { useEffect } from 'react';
import { useUserStore } from '../../../store/user-store';
import { levelEngine } from '../../../services/cme/level-engine';

export const UserLevelBadge: React.FC = () => {
  const { profile, loadProfile } = useUserStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const nextLevelXp = levelEngine.getXpForNextLevel(profile.level);
  const progressPercent = Math.min(100, (profile.currentXp / nextLevelXp) * 100);

  return (
    <div className="flex flex-col items-end min-w-[100px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {profile.archetype || 'Newbie'}
        </span>
        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          LV.{profile.level}
        </span>
      </div>
      
      {/* XP Bar */}
      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="text-[9px] text-gray-400 mt-0.5">
        {profile.currentXp}/{nextLevelXp} XP
      </div>
    </div>
  );
};