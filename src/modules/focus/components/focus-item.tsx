import React, { useState, useEffect, useRef } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types';
// [NEW]: Import tiện ích rung để phản hồi cử chỉ
import { triggerHaptic } from '../../../utils/haptic';

interface FocusItemProps {
  taskId: number;
  isActive: boolean;
}

/**
 * [MOD_FOCUS_UI]: Thành phần hiển thị tác vụ trong chế độ thực thi.
 * Giai đoạn 6.22: Tích hợp Diagonal Swipe-to-Complete (Vuốt chéo để hoàn thành).
 * Cơ chế chống chạm nhầm: Phân biệt Click (+1) và Swipe (Complete) dựa trên Vector tọa độ.
 */
export const FocusItem: React.FC<FocusItemProps> = ({ taskId, isActive }) => {
  // BẢO TỒN 100% LOGIC KẾT NỐI STORE
  const task = useJourneyStore((state) => state.tasks.find((t) => t.id === taskId));
  const { updateTask, incrementDoneCount } = useJourneyStore();

  // State cục bộ để giữ con số đang nhập (BẢO TỒN 100%)
  const [localValue, setLocalValue] = useState<string>('');

  // [NEW]: Refs để theo dõi tọa độ điểm chạm cho bộ lọc cử chỉ vuốt chéo
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Đồng bộ số lượng từ store vào ô nhập mỗi khi dữ liệu thay đổi
  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task?.doneCount]);

  if (!task) return null;

  const isCompleted = task.status === 'done';

  /**
   * [GESTURE LOGIC]: Bắt đầu ghi nhận tọa độ điểm chạm.
   */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted || !isActive) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  /**
   * [GESTURE LOGIC]: Phân tích vector di chuyển khi nhả tay.
   * Tính toán độ biến thiên tọa độ để phân loại hành vi Click hay Diagonal Swipe.
   */
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current || isCompleted || !isActive) return;

    const endX = e.clientX;
    const endY = e.clientY;
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;

    // Tính toán độ lệch (delta)
    const dx = endX - startX;        // Dương khi vuốt từ trái sang phải
    const dy = startY - endY;        // Dương khi vuốt từ dưới lên trên (Y giảm)

    /**
     * CHIẾN THUẬT XÁC THỰC ĐƯỜNG CHÉO:
     * 1. Ngưỡng tối thiểu (Threshold): dx > 60px và dy > 60px.
     * 2. Góc vuốt (Angle Check): 0.5 < dx/dy < 1.5 (Xấp xỉ góc 45 độ).
     */
    const isDiagonalSwipe = dx > 60 && dy > 60 && (dx / dy > 0.5 && dx / dy < 1.5);

    if (isDiagonalSwipe) {
      // HÀNH ĐỘNG 1: Vuốt chéo thành công -> Hoàn thành nhiệm vụ
      triggerHaptic('success'); // Phản hồi xúc giác xác nhận thành công
      updateTask(taskId, {
        status: 'done',
        doneCount: task.targetCount || 1,
        updatedAt: Date.now()
      });
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // HÀNH ĐỘNG 2: Chạm nhẹ (Click) -> Tăng tiến độ +1
      triggerHaptic('light');
      incrementDoneCount(taskId);
    }

    // Reset bộ nhớ điểm chạm
    touchStartRef.current = null;
  };

  /**
   * [ACTION]: Logic Lưu kết quả thủ công (Bên phải) - BẢO TỒN 100%
   */
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
      {/* TRÁI: Nút tích hiển thị trạng thái - Không còn bắt sự kiện độc lập để tránh chạm nhầm */}
      <div 
        className={`relative z-20 mt-1 mr-4 w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          isCompleted ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300'
        }`}
      >
        {isCompleted && <span className="text-[#2563EB] text-xs font-bold">✓</span>}
      </div>

      {/* GIỮA: Nội dung & Tiến độ. Bảo tồn 100% hiển thị văn bản dài. */}
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

      {/* PHẢI: Ô NHẬP SỐ & NÚT LƯU - BẢO TỒN 100% LOGIC THỦ CÔNG */}
      {!isCompleted ? (
        <div 
          className="flex-shrink-0 flex items-center gap-2 bg-slate-50 p-1 rounded-[4px] border border-slate-200 relative z-30 pointer-events-auto mt-0.5"
          onClick={(e) => e.stopPropagation()} // Chặn cử chỉ vuốt lan sang ô nhập liệu
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
        /* Trạng thái hoàn thành: Hiện chỉ số bằng Slate-400 font mono */
        <div className="flex-shrink-0 mt-1 text-slate-400 font-mono text-[10px] font-bold uppercase tracking-tighter">
          {task.doneCount} / {task.targetCount} {task.unit || ''}
        </div>
      )}
    </div>
  );
};