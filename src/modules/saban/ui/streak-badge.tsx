import React from 'react';
import { ITask } from '../../../database/types';
import { streakEngine } from '../streak-engine';

/**
 * [MOD_SABAN]: Hiển thị ngọn lửa Streak dựa trên trạng thái thực thi.
 * Sửa lỗi TS2367 (Comparison) và TS2339 (Property Access).
 */
export const StreakBadge: React.FC<{ task: ITask }> = ({ task }) => {
  // --- 1. SỬA LỖI TS2367: So sánh đúng Status trong Database ---
  // Thay vì "completed", ta dùng "done" như định nghĩa trong ITask
  const isFinished = task.status === 'done';
  const isBacklog = task.status === 'backlog';

  // --- 2. SỬA LỖI TS2339: Chuyển đổi String State sang Visual Object ---
  // streakEngine.getVisualState(task) trả về 'active' | 'recovering' | 'dimmed'
  const stateKey = streakEngine.getVisualState(task);

  // Map các giá trị string sang thuộc tính hiển thị để tránh lỗi truy cập property trên string
  const config = {
    active: {
      icon: '🔥',
      opacity: 1,
      color: 'text-orange-500',
      glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
    },
    recovering: {
      icon: '⏳',
      opacity: 0.5,
      color: 'text-blue-400',
      glow: ''
    },
    dimmed: {
      icon: '🌑',
      opacity: 0.15,
      color: 'text-white/20',
      glow: ''
    }
  };

  const currentVisual = config[stateKey];

  return (
    <div 
      style={{ opacity: currentVisual.opacity }}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/5 bg-white/5 transition-all duration-700 ${currentVisual.glow}`}
    >
      <span className="text-[10px]">
        {currentVisual.icon}
      </span>
      
      <span className={`text-[9px] font-black tracking-tighter ${currentVisual.color}`}>
        {task.streakCurrent || 0}
      </span>

      {/* Hiển thị số ngày hồi phục nếu có */}
      {(task.streakRecoveryCount ?? 0) > 0 && stateKey === 'recovering' && (
        <span className="text-[7px] opacity-40">
          +{task.streakRecoveryCount}
        </span>
      )}
    </div>
  );
};