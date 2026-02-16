import React, { useState, useEffect, useRef } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types';
import { triggerHaptic } from '../../../utils/haptic';

/**
 * [FIX TS2322]: Cập nhật Interface để nhận trực tiếp đối tượng Task.
 * Thay vì nhận 'taskId' (số), component giờ nhận 'task' (đối tượng ITask).
 */
interface FocusItemProps {
  task: ITask; 
  isActive: boolean;
}

/**
 * [MOD_FOCUS_UI]: Thành phần hiển thị tác vụ trong chế độ thực thi.
 * Giai đoạn 6.25: Chuyển đổi kiến trúc sang Direct Prop Passing (Truyền dữ liệu trực tiếp).
 * Tích hợp Diagonal Swipe-to-Complete và Nút thoát Focus.
 */
export const FocusItem: React.FC<FocusItemProps> = ({ task, isActive }) => {
  // [MOD]: Không cần tìm kiếm task trong Store nữa vì đã nhận trực tiếp từ cha.
  // Điều này giúp hiển thị ngay lập tức dữ liệu từ Database (tránh lỗi Ghost Task trên iPhone).
  const { updateTask, incrementDoneCount } = useJourneyStore();

  const [localValue, setLocalValue] = useState<string>('');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Đồng bộ số lượng vào ô nhập
  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task.doneCount]);

  if (!task || !task.id) return null;

  const isCompleted = task.status === 'done';

  /**
   * [ACTION]: Thoát khỏi chế độ Focus (Về Saban).
   * Cập nhật isFocusMode = false và updatedAt = now để nhảy lên đầu Saban.
   */
  const handleRemoveFromFocus = (e: React.PointerEvent) => {
    e.stopPropagation();
    triggerHaptic('light'); // Phản hồi nhẹ khi nhấn nút thoát
    updateTask(task.id!, {
      isFocusMode: false,
      updatedAt: Date.now() // Đẩy lên đầu danh sách Saban
    });
  };

  /**
   * [GESTURE LOGIC]: Bắt đầu ghi nhận tọa độ điểm chạm.
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted || !isActive) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  /**
   * [GESTURE LOGIC]: Phân tích vector di chuyển (Diagonal Swipe).
   */
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current || isCompleted || !isActive) return;

    const endX = e.clientX;
    const endY = e.clientY;
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;

    const dx = endX - startX;        
    const dy = startY - endY;        

    const isDiagonalSwipe = dx > 60 && dy > 60 && (dx / dy > 0.5 && dx / dy < 1.5);

    if (isDiagonalSwipe) {
      triggerHaptic('success'); 
      updateTask(task.id!, {
        status: 'done',
        doneCount: task.targetCount || 1,
        // Không cập nhật updatedAt để giữ vị trí trong Focus
      });
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      triggerHaptic('light');
      incrementDoneCount(task.id!);
    }

    touchStartRef.current = null;
  };

  const handleSave = (e: React.PointerEvent) => {
    e.stopPropagation();
    const val = Number(localValue);
    const target = task.targetCount || 1;
    
    updateTask(task.id!, {
      doneCount: val,
      status: val >= target ? 'done' : task.status,
    });
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative w-full flex items-start p-4 mb-3 rounded-[6px] border transition-all duration-300 ${
        isActive 
          ? 'bg-white border-slate-300 shadow-none scale-[1.01]' 
          : 'bg-slate-50 border-slate-200 opacity-50'
      } ${isCompleted ? 'opacity-40' : 'cursor-pointer'}`}
    >
      {/* TRÁI: Trạng thái */}
      <div 
        className={`relative z-20 mt-1 mr-4 w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          isCompleted ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300'
        }`}
      >
        {isCompleted && <span className="text-[#2563EB] text-xs font-bold">✓</span>}
      </div>

      {/* GIỮA: Nội dung */}
      <div className="flex-1 min-w-0 mr-4">
        <h3 className={`text-base font-bold tracking-tight break-words whitespace-pre-wrap leading-snug ${
          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
        }`}>
          {task.content}
        </h3>
        
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden w-full relative">
          <div 
            className="h-full bg-[#2563EB] transition-all duration-500 shadow-none"
            style={{ width: `${Math.min(100, (Number(task.doneCount || 0) / (task.targetCount || 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* PHẢI: Các nút điều khiển */}
      <div className="flex flex-col items-end gap-2 relative z-30">
        {/* Nút thoát Focus (X) */}
        <button
          onPointerDown={handleRemoveFromFocus}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Ô nhập số thủ công */}
        {!isCompleted ? (
          <div 
            className="flex items-center gap-2 bg-slate-50 p-1 rounded-[4px] border border-slate-200 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
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
          <div className="mt-1 text-slate-400 font-mono text-[10px] font-bold uppercase tracking-tighter">
            {task.doneCount} / {task.targetCount} {task.unit || ''}
          </div>
        )}
      </div>
    </div>
  );
};