import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types'; // [cite: 34]

interface FocusItemProps {
  taskId: number;
  isActive: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({ taskId, isActive }) => {
  const task = useJourneyStore((state) => state.tasks.find((t) => t.id === taskId));
  const { updateTask, incrementDoneCount } = useJourneyStore();

  // State cục bộ để giữ con số đang nhập
  const [localValue, setLocalValue] = useState<string>('');

  // Đồng bộ số lượng từ store vào ô nhập mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task?.doneCount]);

  if (!task) return null;

  const isCompleted = task.status === 'done';

  // 1. Giữ nguyên: Nút tích hoàn thành nhanh (Bên trái) [cite: 35]
  const handleQuickComplete = (e: React.PointerEvent) => {
    e.stopPropagation();
    updateTask(taskId, {
      status: 'done',
      doneCount: task.targetCount || 1,
      updatedAt: Date.now()
    });
  };

  // 2. MỚI: Logic Lưu kết quả thủ công (Bên phải)
  const handleSave = (e: React.PointerEvent) => {
    e.stopPropagation();
    const val = Number(localValue);
    const target = task.targetCount || 1;
    
    updateTask(taskId, {
      doneCount: val,
      status: val >= target ? 'done' : task.status,
      updatedAt: Date.now()
    });
  };

  // 3. Giữ nguyên: Bấm vào thân task để +1 (nếu Laptop không chặn)
  const handleBodyClick = () => {
    if (!isCompleted) incrementDoneCount(taskId);
  };

  return (
    <div 
      onClick={handleBodyClick}
      className={`relative w-full flex items-center p-4 mb-3 rounded-2xl transition-all duration-300 ${
        isActive ? 'bg-zinc-900 border border-zinc-700 shadow-xl scale-[1.02]' : 'bg-zinc-900/40 border-transparent opacity-50'
      } ${isCompleted ? 'opacity-40' : 'cursor-pointer'}`}
    >
      {/* TRÁI: Nút tích hoàn thành [cite: 35] */}
      <div 
        onPointerDown={handleQuickComplete}
        className="relative z-20 mr-4 w-6 h-6 flex-shrink-0 rounded-full border-2 border-zinc-500 flex items-center justify-center hover:border-white transition-colors"
      >
        {isCompleted && <span className="text-green-500 text-xs">✓</span>}
      </div>

      {/* GIỮA: Nội dung & Tiến độ [cite: 35, 37] */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className={`text-base font-semibold truncate ${isCompleted ? 'line-through text-zinc-600' : 'text-white'}`}>
          {task.content}
        </h3>
        
        {/* Thanh tiến độ [cite: 37] */}
        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden w-full relative">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (Number(task.doneCount || 0) / (task.targetCount || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* PHẢI: Ô NHẬP SỐ & NÚT LƯU (MỚI) */}
      {!isCompleted ? (
        <div 
          className="flex-shrink-0 flex items-center gap-2 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 relative z-30 pointer-events-auto"
          onClick={(e) => e.stopPropagation()} // Chặn click lan ra ngoài
        >
          <input 
            type="text" 
            inputMode="numeric"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-10 bg-transparent text-center text-white font-mono text-sm outline-none border-b border-zinc-500 focus:border-blue-400"
            placeholder="0"
          />
          
          <button
            onPointerDown={handleSave}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-[10px] font-bold text-white uppercase tracking-tighter shadow-lg transition-transform active:scale-90"
          >
            Lưu
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0 text-zinc-500 font-mono text-xs font-bold uppercase">
          {task.doneCount} / {task.targetCount} {task.unit || ''}
        </div>
      )}
    </div>
  );
};