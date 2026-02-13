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
    e.stopPropagation();
    console.log(`🎯 Hitbox Clicked: Task ID ${taskId}`); // Log xác nhận
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
  
  // Container chính: Tắt touch-action để tránh conflict scroll
  const containerClass = `
    group relative flex items-center p-4 mb-3 rounded-2xl transition-all duration-300
    ${isActive ? 'bg-zinc-900 border border-zinc-700 shadow-xl scale-[1.02]' : 'bg-zinc-900/40 border border-transparent opacity-50'}
    ${isCompleted ? 'opacity-40' : 'active:scale-95'}
    select-none touch-none
  `;

  return (
    <div className={containerClass}>
      
      {/* --- HITBOX CURTAIN (LỚP MÀNG CẢM ỨNG) --- */}
      {/* Lớp này phủ lên TOÀN BỘ item, chịu trách nhiệm nhận Click */}
      <div 
        onPointerDown={handlePointerDown}
        className="absolute inset-0 z-20 cursor-pointer rounded-2xl"
      />

      {/* --- NÚT HOÀN THÀNH (BÊN TRÁI) --- */}
      {/* z-30 để nổi lên trên lớp Hitbox (20), giúp bấm riêng được */}
      <div 
        onPointerDown={handleQuickComplete}
        className="relative z-30 mr-4 w-6 h-6 rounded-full border-2 border-zinc-500 flex items-center justify-center hover:border-white transition-colors cursor-pointer"
      >
        {isCompleted && <span className="text-green-500 text-xs">✓</span>}
      </div>

      {/* --- NỘI DUNG (TEXT & THANH TIẾN ĐỘ) --- */}
      {/* pointer-events-none: Vô hiệu hóa chuột ở đây để click xuyên qua trúng Hitbox */}
      <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
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

      {/* --- NÚT +1 (VISUAL ONLY) --- */}
      {isActive && !isCompleted && (
        <div className="relative z-10 ml-4 w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-400 group-active:text-white pointer-events-none">
          +1
        </div>
      )}
    </div>
  );
};