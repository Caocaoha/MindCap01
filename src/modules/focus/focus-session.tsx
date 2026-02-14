import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [MOD_FOCUS]: Chế độ thực thi tập trung.
 * Giai đoạn 3: Cập nhật thẩm mỹ Linear.app (Pure White background, Slate-200 borders).
 */
export const FocusSession: React.FC = () => {
  // Lấy tối đa 4 việc đang thực thi (Bảo tồn 100% logic)
  const focusTasks = useLiveQuery(async () => {
    return await db.tasks
      .toCollection()
      .filter(t => t.isFocusMode === true) 
      .toArray()
      .then(tasks => tasks.slice(0, 4));
  }, []);

  // EMPTY STATE: Chuyển sang phong cách Linear phẳng
  if (!focusTasks || focusTasks.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Deep Work Session</p>
        <p className="text-[9px] mt-2 text-slate-300 italic">Chọn việc từ Saban để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white">
      <header className="px-2 flex justify-between items-end border-b border-slate-100 pb-4">
        <div>
          {/* TEXT: Chuyển sang Slate-900 chuẩn chuyên nghiệp */}
          <h2 className="text-3xl font-bold tracking-tighter text-slate-900">FOCUS</h2>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Thực thi mục tiêu</p>
        </div>
      </header>

      <div className="space-y-3">
        {focusTasks.map(task => (
          <FocusCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

/**
 * [FOCUS_CARD]: Thẻ thực thi với tương tác cử chỉ.
 */
const FocusCard: React.FC<{ task: ITask }> = ({ task }) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<any>(null);
  const touchStartY = useRef<number>(0);
  const lastUpdate = useRef<number>(0);

  // LOGIC CẬP NHẬT CHÍNH (Bảo tồn 100%)
  const updateProgress = async (newCount: number, forceComplete = false) => {
    const now = Date.now();
    if (now - lastUpdate.current < 50 && !forceComplete) return;
    lastUpdate.current = now;

    const target = task.targetCount || 1;
    const finalCount = forceComplete ? target : Math.max(0, Math.min(newCount, target));
    const isActuallyDone = forceComplete || finalCount >= target;

    await db.tasks.update(task.id!, {
      doneCount: finalCount,
      status: isActuallyDone ? 'done' : 'todo',
      isFocusMode: isActuallyDone ? false : true, // Tự động trả về Saban
      updatedAt: now
    });

    if (isActuallyDone) triggerHaptic('success');
    else triggerHaptic('light');
  };

  // NÚT TÍCH NHANH (Bảo tồn logic)
  const handleQuickFinish = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); 
    triggerHaptic('success');
    updateProgress(task.targetCount || 1, true);
  };

  // CỬ CHỈ VUỐT & CHẠM (Bảo tồn logic)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(deltaY) < 10) { 
      updateProgress((task.doneCount || 0) + 1);
    } else if (deltaY > 30) { 
      updateProgress((task.doneCount || 0) + 1);
    } else if (deltaY < -30) { 
      updateProgress((task.doneCount || 0) - 1);
    }
  };

  // HOLD TO FILL (Bảo tồn logic)
  const startHolding = (e: any) => {
    e.stopPropagation();
    setIsHolding(true);
    holdTimer.current = setInterval(() => {
      updateProgress((task.doneCount || 0) + 1);
    }, 150);
  };

  const stopHolding = () => {
    setIsHolding(false);
    if (holdTimer.current) clearInterval(holdTimer.current);
  };

  const progressPercent = ((task.doneCount || 0) / (task.targetCount || 1)) * 100;

  return (
    /* CARD CONTAINER: Nền trắng, Border Slate-200, Bo góc 6px */
    <div 
      className="relative overflow-hidden bg-white border border-slate-200 rounded-[6px] p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* NÚT TÍCH NHANH: Chuyển sang phong cách Linear (Slate-50 background, Blue icon when done) */}
      <button 
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={handleQuickFinish}
        className="relative z-20 w-10 h-10 flex items-center justify-center rounded-[6px] bg-slate-50 border border-slate-100 active:scale-75 transition-transform"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-active:opacity-100">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      {/* THANH TIẾN ĐỘ CHẢY: Chuyển sang màu Xanh nhấn #2563EB */}
      <div 
        onPointerDown={startHolding} onPointerUp={stopHolding} onPointerLeave={stopHolding}
        className="absolute inset-0 bg-[#2563EB] transition-all duration-300 pointer-events-auto"
        style={{ width: `${progressPercent}%`, opacity: isHolding ? 0.15 : 0.05 }}
      />

      <div className="relative z-10 flex-1 flex justify-between items-center pointer-events-none">
        <div className="min-w-0 pr-4">
          {/* TEXT CONTENT: Slate-900 Inter font */}
          <h3 className="text-base font-bold tracking-tight text-slate-900 truncate">{task.content}</h3>
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">{task.unit || 'mục tiêu'}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xl font-bold font-mono tracking-tighter text-slate-900">
            {task.doneCount || 0}<span className="text-slate-200 mx-0.5">/</span>{task.targetCount}
          </div>
          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-300">{task.unit || 'LẦN'}</p>
        </div>
      </div>
    </div>
  );
};