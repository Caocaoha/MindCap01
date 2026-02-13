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

  // Xử lý khi bấm vào vùng Hitbox (Vùng thân task)
  const handleMainClick = (e: React.PointerEvent) => {
    e.stopPropagation();
    console.log(`🎯 Hitbox Click: Task ID ${taskId}`);
    if (task.status !== 'done') {
      incrementDoneCount(taskId);
    }
  };

  // Xử lý khi bấm nút hoàn thành (Checkmark)
  const handleQuickComplete = (e: React.PointerEvent) => {
    e.stopPropagation();
    // e.preventDefault() giúp ngăn sự kiện xuyên qua xuống Hitbox bên dưới
    e.preventDefault(); 
    
    updateTask(taskId, {
      status: 'done',
      doneCount: task.targetCount || 1,
      updatedAt: Date.now()
    });
  };

  const isCompleted = task.status === 'done';
  
  const containerClass = `
    group relative w-full flex items-center p-4 mb-3 rounded-2xl transition-all duration-300
    ${isActive ? 'bg-zinc-900 border border-zinc-700 shadow-xl scale-[1.02]' : 'bg-zinc-900/40 border border-transparent opacity-50'}
    ${isCompleted ? 'opacity-40' : 'active:scale-95'}
    select-none
  `;

  return (
    <div className={containerClass}>
      
      {/* === LỚP 1: HITBOX TÀNG HÌNH (QUAN TRỌNG NHẤT) === */}
      {/* Đây là nút bấm phủ kín toàn bộ Item. z-10 để nằm trên nội dung text/thanh màu */}
      <button
        onPointerDown={handleMainClick}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer bg-transparent border-none outline-none"
        type="button"
        aria-label="Increment task progress"
      />

      {/* === LỚP 2: NÚT HOÀN THÀNH (BÊN TRÁI) === */}
      {/* z-20 để nằm TRÊN lớp Hitbox, giúp bấm riêng được */}
      <div className="relative z-20 mr-4">
        <button 
          onPointerDown={handleQuickComplete}
          className="w-6 h-6 rounded-full border-2 border-zinc-500 flex items-center justify-center hover:border-white transition-colors bg-transparent"
        >
          {isCompleted && <span className="text-green-500 text-xs">✓</span>}
        </button>
      </div>

      {/* === LỚP 0: NỘI DUNG HIỂN THỊ (TEXT & THANH TIẾN ĐỘ) === */}
      {/* pointer-events-none: Vô hiệu hóa chuột hoàn toàn ở đây để không chặn Hitbox ở Lớp 1 */}
      <div className="flex-1 min-w-0 relative z-0 pointer-events-none">
        <h3 className={`text-base font-semibold truncate ${isCompleted ? 'line-through text-zinc-600' : 'text-white'}`}>
          {task.content}
        </h3>
        
        {task.targetCount && task.targetCount > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              {/* Thanh màu này từng chặn click, giờ đã bị pointer-events-none vô hiệu hóa */}
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

      {/* === LỚP 0: VISUAL +1 === */}
      {isActive && !isCompleted && (
        <div className="ml-4 w-8 h-8 flex flex-shrink-0 items-center justify-center bg-zinc-800 rounded-full text-zinc-400 group-active:text-white pointer-events-none relative z-0">
          +1
        </div>
      )}
    </div>
  );
};