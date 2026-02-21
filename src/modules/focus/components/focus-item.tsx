import React, { useState, useEffect } from 'react';
import { useJourneyStore } from '../../../store/journey-store'; 
import { ITask } from '../../../database/types';
import { triggerHaptic } from '../../../utils/haptic';

interface FocusItemProps {
  task: ITask; 
  isActive: boolean;
}

/**
 * [MOD_FOCUS_UI]: Thành phân hiển thị tác vụ trong chế độ thực thi.
 * Giai đoạn 6.36: Nâng cấp UI theo phong cách Modern Card (No Border, Soft Shadow, 12px Radius).
 */
export const FocusItem: React.FC<FocusItemProps> = ({ task, isActive }) => {
  const { updateTask, incrementDoneCount } = useJourneyStore();
  const [localValue, setLocalValue] = useState<string>('');

  useEffect(() => {
    if (task) {
      setLocalValue(String(task.doneCount || 0));
    }
  }, [task.doneCount]);

  if (!task || !task.id) return null;

  const isCompleted = task.status === 'done';

  // --- ACTION HANDLERS ---

  /**
   * [ZONE A - LEFT]: Hoàn thành nhiệm vụ (Check Button).
   * Logic: Chặn lan truyền tuyệt đối để không kích hoạt +1 của thẻ cha.
   */
  const handleComplete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); 
    triggerHaptic('success');
    updateTask(task.id!, {
      status: 'done',
      doneCount: task.targetCount || 1,
      isFocusMode: false,
      updatedAt: Date.now() // [IMPORTANT]: Đánh dấu mốc hoàn thành để Engine so sánh 0h
    });
  };

  /**
   * [ZONE B - CENTER]: Tăng số lượng thực hiện (Body Tap).
   */
  const handleIncrement = () => {
    if (isCompleted || !isActive) return;
    triggerHaptic('light');
    incrementDoneCount(task.id!); 
    // Lưu ý: Cần đảm bảo hàm incrementDoneCount trong Store cũng cập nhật updatedAt.
  };

  /**
   * [ZONE C - RIGHT]: Thoát khỏi chế độ Focus (X Button).
   */
  const handleRemoveFromFocus = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    updateTask(task.id!, {
      isFocusMode: false,
      // Không thay đổi trạng thái hoàn thành, nhưng vẫn ghi nhận lần tương tác cuối
      updatedAt: task.updatedAt || Date.now() 
    });
  };

  /**
   * [ZONE C - RIGHT]: Lưu số lượng thủ công (Save Button).
   */
  const handleSave = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const val = Number(localValue);
    const target = task.targetCount || 1;
    const isFinished = val >= target;
    
    updateTask(task.id!, {
      doneCount: val,
      status: isFinished ? 'done' : task.status,
      isFocusMode: isFinished ? false : task.isFocusMode,
      // [FIX]: Luôn cập nhật updatedAt khi có thay đổi về tiến độ/trạng thái
      updatedAt: Date.now() 
    });
  };

  return (
    <div 
      onClick={handleIncrement} 
      className={`relative w-full flex items-start gap-3 p-4 mb-3 rounded-[12px] transition-all duration-300 select-none ${
        isActive 
          ? 'bg-white shadow-md scale-[1.02] active:scale-[0.98]' 
          : 'bg-[#F8F9FA] shadow-[0_4px_6px_rgba(0,0,0,0.05)] opacity-80' 
      } ${isCompleted ? 'opacity-40 grayscale' : 'cursor-pointer'}`}
    >
      {/* --- ZONE A: TRÁI (Check Button) --- */}
      <div 
        onClick={handleComplete}
        className="relative z-20 flex-shrink-0 pt-1"
      >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors hover:bg-slate-100 active:scale-90 ${
          isCompleted ? 'border-[#2563EB] bg-blue-50' : 'border-slate-300'
        }`}>
          {isCompleted && <span className="text-[#2563EB] text-xs font-bold">✓</span>}
        </div>
      </div>

      {/* --- ZONE B: GIỮA (Nội dung & Tiến độ) --- */}
      <div className="flex-1 min-w-0">
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

      {/* --- ZONE C: PHẢI (Control Panel) --- */}
      <div 
        className="flex-shrink-0 flex flex-col items-end gap-3 z-30" 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleRemoveFromFocus}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {!isCompleted ? (
          <div className="flex items-center gap-1 bg-white p-1 rounded-[6px] shadow-sm border border-slate-100">
            <input 
              type="text" 
              inputMode="numeric"
              value={localValue}
              onClick={(e) => e.stopPropagation()} 
              onChange={(e) => setLocalValue(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-8 bg-transparent text-center text-slate-900 font-mono text-xs font-bold outline-none border-b border-slate-200 focus:border-[#2563EB]"
              placeholder="0"
            />
            
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-[#2563EB] hover:bg-blue-700 rounded-[4px] text-[9px] font-bold text-white uppercase tracking-wider transition-all active:scale-90"
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