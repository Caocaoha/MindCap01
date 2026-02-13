import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types'; 

interface FocusItemProps {
  taskId: number;
  isActive: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({ taskId, isActive }) => {
  const task = useJourneyStore((state) => state.tasks.find((t) => t.id === taskId));
  const { updateTask } = useJourneyStore();

  const [localValue, setLocalValue] = useState<string>('');

  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task?.doneCount]);

  if (!task) return null;

  // 1. Logic nút hoàn thành nhanh (Bên trái)
  const handleQuickComplete = (e: React.PointerEvent) => {
    e.stopPropagation();
    updateTask(taskId, {
      status: 'done',
      doneCount: task.targetCount || 1,
      updatedAt: Date.now()
    });
  };

  // 2. Logic nhập liệu (Input số)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Chỉ cho phép nhập số
    const val = e.target.value.replace(/[^0-9]/g, '');
    setLocalValue(val);
  };

  // 3. Logic nút Lưu (Save)
  const handleManualSave = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const newCount = Number(localValue);
    const target = task.targetCount || 1;
    const shouldComplete = newCount >= target;

    updateTask(taskId, {
      doneCount: newCount,
      status: shouldComplete ? 'done' : task.status, 
      updatedAt: Date.now()
    });
  };

  // Ngăn click lan ra container khi bấm vào vùng nhập liệu
  const stopPropagation = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  const isCompleted = task.status === 'done';
  
  const containerClass = `
    relative w-full flex items-center p-4 mb-3 rounded-2xl transition-all duration-300
    ${isActive ? 'bg-zinc-900 border border-zinc-700 shadow-xl' : 'bg-zinc-900/40 border border-transparent opacity-50'}
    ${isCompleted ? 'opacity-40' : 'active:scale-[0.99]'}
    select-none
  `;

  return (
    <div className={containerClass}>
      
      {/* --- PHẦN 1: NÚT HOÀN THÀNH (BÊN TRÁI) --- */}
      <div 
        onPointerDown={handleQuickComplete}
        className="relative z-20 mr-4 w-6 h-6 flex-shrink-0 rounded-full border-2 border-zinc-500 flex items-center justify-center hover:border-white transition-colors cursor-pointer"
      >
        {isCompleted && <span className="text-green-500 text-xs">✓</span>}
      </div>

      {/* --- PHẦN 2: NỘI DUNG CHÍNH (TEXT & THANH TIẾN ĐỘ) --- */}
      <div className="flex-1 min-w-0 mr-2">
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
            {/* Ẩn số hiển thị cũ để tránh lặp lại với ô nhập liệu mới */}
            {isCompleted && (
              <span className="text-[10px] font-mono text-zinc-500">
                {task.doneCount || 0} / {task.targetCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* --- PHẦN 3: CỤM NHẬP LIỆU (LUÔN HIỆN KHI CHƯA DONE) --- */}
      {!isCompleted && (
        <div 
          className="relative z-[60] flex items-center gap-1 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700 pointer-events-auto"
          onPointerDown={stopPropagation} // Chặn click lan ra container
          onClick={stopPropagation}
        >
          {/* Ô nhập số */}
          <input 
            type="text" 
            inputMode="numeric"
            value={localValue}
            onChange={handleInputChange}
            // onFocus để chặn bàn phím ảo kích hoạt sự kiện khác
            onClick={(e) => e.stopPropagation()}
            className="w-8 bg-transparent text-center text-white font-mono text-sm outline-none border-b border-zinc-500 focus:border-blue-500 transition-colors p-0"
            placeholder="0"
          />
          
          <span className="text-[10px] text-zinc-500 select-none">/ {task.targetCount || 1}</span>

          {/* Nút Lưu (Icon Save) */}
          <button
            onPointerDown={handleManualSave}
            className="w-7 h-7 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 rounded text-green-500 transition-colors ml-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Hiển thị số tĩnh nếu ĐÃ HOÀN THÀNH */}
      {isCompleted && (
         <div className="ml-4 text-zinc-500 font-mono text-xs">
           {task.doneCount}
         </div>
      )}
    </div>
  );
};