import React from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types'; 

interface FocusItemProps {
  taskId: number;
  isActive: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({ taskId, isActive }) => {
  const task = useJourneyStore((state) => state.tasks.find((t) => t.id === taskId));
  const { incrementDoneCount, updateTask } = useJourneyStore();

  if (!task) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    // Chấp nhận mọi loại thiết bị (Chuột/Touch) lọt vào đây
    e.stopPropagation();

    // Log này BUỘC phải hiện nếu phân tầng z-index đã đúng
    console.log(`🎯 MindCap Trace: Interaction detected on ID ${taskId}`);

    if (task.status !== 'done') {
      incrementDoneCount(taskId);
    }
  };

  const handleQuickComplete = (e: React.PointerEvent) => {
    e.stopPropagation();
    updateTask(taskId, {
      status: 'done',
      doneCount: task.targetCount || 1,
      updatedAt: Date.now()
    });
  };

  const isCompleted = task.status === 'done';
  
  // GIẢI PHÁP: z-index nội bộ z-50 để chắc chắn nằm trên footer
  const containerClass = `
    group relative z-50 pointer-events-auto flex items-center p-4 mb-3 rounded-2xl transition-all duration-300
    ${isActive ? 'bg-zinc-900 border border-zinc-700 shadow-xl scale-[1.02]' : 'bg-zinc-900/40 border border-transparent opacity-50'}
    ${isCompleted ? 'opacity-40' : 'active:scale-95'}
    select-none touch-none cursor-pointer
  `;

  return (
    <div 
      onPointerDown={handlePointerDown}
      className={containerClass}
      style={{ cursor: isCompleted ? 'default' : 'pointer' }}
    >
      <div 
        onPointerDown={handleQuickComplete}
        className="mr-4 w-6 h-6 rounded-full border-2 border-zinc-500 flex items-center justify-center hover:border-white transition-colors z-50"
      >
        {isCompleted && <span className="text-green-500 text-xs">✓</span>}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-base font-semibold truncate ${isCompleted ? 'line-through text-zinc-600' : 'text-white'}`}>
          {task.content}
        </h3>
        
        {task.targetCount && task.targetCount > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (Number(task.doneCount || 0) / task.targetCount) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {task.doneCount || 0} / {task.targetCount}
            </span>
          </div>
        )}
      </div>

      {isActive && !isCompleted && (
        <div className="ml-4 w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-400 group-active:text-white">
          +1
        </div>
      )}
    </div>
  );
};