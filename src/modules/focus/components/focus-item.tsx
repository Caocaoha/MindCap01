import React from 'react';
import { CheckCircle, Circle, Plus } from 'lucide-react';
import { ITask } from '../../../database/types';
import { useJourneyStore } from '../../../store/journey-store';

interface FocusItemProps {
  task: ITask;
  isActive: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({ task, isActive }) => {
  const { incrementDoneCount, updateTask } = useJourneyStore();

  const handleQuickComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.id) return;
    await updateTask(task.id, {
      status: 'done',
      doneCount: task.targetCount || 1,
      updatedAt: Date.now()
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.id && task.status !== 'done') {
      incrementDoneCount(task.id);
    }
  };

  // Thay thế cn bằng template literals chuẩn
  const containerClass = `group flex items-center p-4 mb-3 rounded-2xl transition-all duration-300 ${
    isActive ? "bg-zinc-900 border border-zinc-700 shadow-lg scale-[1.02]" : "bg-zinc-900/40 border border-transparent opacity-60"
  } ${task.status === 'done' ? "opacity-40" : ""}`;

  return (
    <div className={containerClass}>
      <button onClick={handleQuickComplete} className="mr-4 transition-transform active:scale-75">
        {task.status === 'done' ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-zinc-500 group-hover:text-zinc-300" />
        )}
      </button>

      <div className="flex-1 min-w-0" onClick={handleIncrement}>
        <h3 className={`text-base font-semibold truncate ${task.status === 'done' ? "line-through text-zinc-500" : ""}`}>
          {task.content}
        </h3>
        {task.targetCount && task.targetCount > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((task.doneCount || 0) / task.targetCount) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {task.doneCount || 0}/{task.targetCount}
            </span>
          </div>
        )}
      </div>

      {isActive && task.status !== 'done' && (
        <button onClick={handleIncrement} className="ml-4 w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-full active:scale-90 shadow-md">
          <Plus className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};