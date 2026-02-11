// src/modules/saban/components/SabanTaskItem.tsx
import React from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, motion } from 'framer-motion';
import { Task } from '../../../database/types';
import { Flame } from 'lucide-react';
import { getDayGap, getFireStatus } from '../logic/streakEngine';

interface SabanTaskItemProps {
  task: Task;
  onSwipe: () => void;
}

export const SabanTaskItem: React.FC<SabanTaskItemProps> = ({ task, onSwipe }) => {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(({ down, movement: [mx], cancel }) => {
    // Swipe Right Logic
    if (mx > 100 && down) {
      cancel(); // Stop drag
      onSwipe(); // Trigger action
      api.start({ x: 0 }); // Reset immediately or animate out
    } else {
      api.start({ x: down ? mx : 0, immediate: down });
    }
  }, { axis: 'x', filterTaps: true });

  // Streak Logic Visuals
  const gap = getDayGap(task.streak_last_date);
  const isRecovering = (task.streak_frozen_val || 0) > 0;
  const { opacity, visible } = task.isRecurring ? getFireStatus(gap, isRecovering) : { opacity: 0, visible: false };

  // Priority Colors
  const priorityColor = {
    critical: 'border-l-red-500',
    urgent: 'border-l-orange-500',
    important: 'border-l-blue-500',
    normal: 'border-l-slate-300'
  }[task.priority] || 'border-l-slate-200';

  return (
    <div className="relative h-16 touch-pan-y">
      {/* Background Action Layer */}
      <div className="absolute inset-0 bg-blue-600 rounded-xl flex items-center px-6 text-white font-bold tracking-widest">
        FOCUS
      </div>

      {/* Foreground Task Card */}
      <motion.div
        {...bind()}
        style={{ x, touchAction: 'pan-y' }}
        className={`relative h-full bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4 gap-3 border-l-4 ${priorityColor}`}
      >
        <div className="flex-1 truncate">
          <div className="text-slate-800 font-medium truncate">{task.content}</div>
          {task.quantity && (
            <div className="text-xs text-slate-400">{task.quantity} {task.unit}</div>
          )}
        </div>

        {/* Streak Icon */}
        {visible && (
          <div className="flex items-center gap-1" style={{ opacity }}>
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span className="text-xs font-bold text-orange-600">
              {task.streak_current && task.streak_current > 99 ? '99+' : task.streak_current}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};