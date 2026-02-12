import React from 'react';
import type { ITask } from '../../../database/types';
import { streakEngine } from '../streak-engine';

export const StreakBadge: React.FC<{ task: ITask }> = ({ task }) => {
  // Chỉ hiện cho task chưa hoàn thành (Active) và có tần suất lặp lại
  if (task.status === 'completed' || task.status === 'dismissed') return null;
  if (!task.frequency || task.frequency === 'ONCE') return null;

  const { isVisible, opacity } = streakEngine.getVisualState(task);

  if (!isVisible) return null;

  // [FIX ERROR]: Xử lý trường hợp streakCurrent bị undefined
  const currentStreak = task.streakCurrent ?? 0;
  
  const displayNum = currentStreak > 99 ? '99+' : currentStreak;

  return (
    <div 
      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 transition-all duration-300"
      style={{ opacity }}
      title={`Streak: ${currentStreak} | Recovery: ${task.streakRecoveryCount || 0}/3`}
    >
      <span className="text-sm animate-pulse">🔥</span>
      <span className="text-xs font-bold text-orange-600 font-mono">
        {displayNum}
      </span>
    </div>
  );
};