import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types'; //

interface FocusItemProps {
  taskId: number;
  isActive: boolean;
}

/**
 * [MOD_FOCUS_UI]: Thành phần hiển thị tác vụ trong chế độ thực thi.
 * Giai đoạn 4: Thẩm mỹ Linear.app & Tối ưu hóa iPhone (Vertical Expansion).
 * Đảm bảo hiển thị trọn vẹn nội dung văn bản và bảo toàn 100% logic Store.
 */
export const FocusItem: React.FC<FocusItemProps> = ({ taskId, isActive }) => {
  // BẢO TỒN 100% LOGIC KẾT NỐI STORE
  const task = useJourneyStore((state) => state.tasks.find((t) => t.id === taskId));
  const { updateTask, incrementDoneCount } = useJourneyStore();

  // State cục bộ để giữ con số đang nhập (Bảo tồn logic gốc)
  const [localValue, setLocalValue] = useState<string>('');

  // Đồng bộ số lượng từ store vào ô nhập mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task?.doneCount]);

  if (!task) return null;

  const isCompleted = task.status === 'done';

  // 1. Giữ nguyên: Nút tích hoàn thành nhanh (Bên trái)
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

  // 3. Giữ nguyên: Bấm vào thân task để +1
  const handleBodyClick = () => {
    if (!isCompleted) incrementDoneCount(taskId);
  };

  return (
    /* CONTAINER: Chuyển sang items-start để nút bấm luôn ở đỉnh khi văn bản dài.
       Nền trắng, Border Slate-200, bo góc 6px theo DNA Linear.
    */
    <div 
      onClick={handleBodyClick}
      className={`relative w-full flex items-start p-4 mb-3 rounded-[6px] border transition-all duration-300 ${
        isActive 
          ? 'bg-white border-slate-300 shadow-none scale-[1.01]' 
          : 'bg-slate-50 border-slate-200 opacity-50'
      } ${isCompleted ? 'opacity-40' : 'cursor-pointer'}`}
    >
      {/* TRÁI: Nút tích hoàn thành - Chuyển sang màu Xanh nhấn chuẩn Linear #2563EB */}
      <div 
        onPointerDown={handleQuickComplete}
        className="relative z-20 mt-1 mr-4 w-6 h-6 flex-shrink-0 rounded-full border-2 border-slate-300 flex items-center justify-center hover:border-[#2563EB] transition-colors"
      >
        {isCompleted && <span className="text-[#2563EB] text-xs font-bold">✓</span>}
      </div>

      {/* GIỮA: Nội dung & Tiến độ. Gỡ bỏ 'truncate' để hiện đủ văn bản textarea. */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className={`text-base font-bold tracking-tight break-words whitespace-pre-wrap leading-snug ${
          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
        }`}>
          {task.content}
        </h3>
        
        {/* Thanh tiến độ: Tối giản màu Slate-100 và Blue #2563EB */}
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden w-full relative">
          <div 
            className="h-full bg-[#2563EB] transition-all duration-500 shadow-none"
            style={{ width: `${Math.min(100, (Number(task.doneCount || 0) / (task.targetCount || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* PHẢI: Ô NHẬP SỐ & NÚT LƯU. Cố định vị trí bằng flex-shrink-0 */}
      {!isCompleted ? (
        <div 
          className="flex-shrink-0 flex items-center gap-2 bg-slate-50 p-1 rounded-[4px] border border-slate-200 relative z-30 pointer-events-auto mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input 
            type="text" 
            inputMode="numeric"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-10 bg-transparent text-center text-slate-900 font-mono text-xs font-bold outline-none border-b border-slate-300 focus:border-[#2563EB]"
            placeholder="0"
          />
          
          <button
            onPointerDown={handleSave}
            className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 rounded-[4px] text-[10px] font-bold text-white uppercase tracking-widest transition-all active:scale-90"
          >
            Lưu
          </button>
        </div>
      ) : (
        /* Trạng thái hoàn thành: Hiện chỉ số bằng Slate-400 font mono */
        <div className="flex-shrink-0 mt-1 text-slate-400 font-mono text-[10px] font-bold uppercase tracking-tighter">
          {task.doneCount} / {task.targetCount} {task.unit || ''}
        </div>
      )}
    </div>
  );
};