import React from 'react';
import { ITask } from '../../../database/types';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
import { db } from '../../../database/db';

// ... (các import giữ nguyên)
export const TaskCard: React.FC<{ task: ITask }> = ({ task }) => {
  const { openEditModal } = useUiStore();
  const isMultiTarget = (task.targetCount ?? 0) > 1;

  return (
    <div className="group flex items-center gap-4 p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-white/90 font-medium truncate">{task.content}</p>
          {isMultiTarget && (
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono">
              {task.doneCount ?? 0} / {task.targetCount}
            </span>
          )}
        </div>
        {/* ... (phần tags giữ nguyên) */}
      </div>
      {/* ... (các nút Edit/Thực thi giữ nguyên) */}
    </div>
  );
};