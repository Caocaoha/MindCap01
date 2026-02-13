import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

export const FocusSession: React.FC = () => {
  // Lấy tối đa 4 việc đang thực thi
  const focusTasks = useLiveQuery(async () => {
    return await db.tasks
      .toCollection()
      .filter(t => t.isFocusMode === true) 
      .toArray()
      .then(tasks => tasks.slice(0, 4));
  }, []);

  if (!focusTasks || focusTasks.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/5 rounded-[3rem]">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Deep Work Session</p>
        <p className="text-[8px] mt-2 opacity-50 italic">Chọn việc từ Saban để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="px-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">FOCUS</h2>
          <p className="text-[9px] uppercase tracking-widest opacity-30 font-bold">Thực thi mục tiêu</p>
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

const FocusCard: React.FC<{ task: ITask }> = ({ task }) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<any>(null);
  const touchStartY = useRef<number>(0);
  const lastUpdate = useRef<number>(0);

  // LOGIC CẬP NHẬT CHÍNH
  const updateProgress = async (newCount: number, forceComplete = false) => {
    // Ngăn chặn update quá nhanh gây lag DB
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

  // NÚT TÍCH NHANH (QUICK FINISH)
  const handleQuickFinish = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Ngăn sự kiện chạm vào thẻ chính
    triggerHaptic('success');
    updateProgress(task.targetCount || 1, true);
  };

  // CỬ CHỈ VUỐT & CHẠM
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(deltaY) < 10) { // TAP TO STEP
      updateProgress((task.doneCount || 0) + 1);
    } else if (deltaY > 30) { // SWIPE UP (DIAL UP)
      updateProgress((task.doneCount || 0) + 1);
    } else if (deltaY < -30) { // SWIPE DOWN (DIAL DOWN)
      updateProgress((task.doneCount || 0) - 1);
    }
  };

  // HOLD TO FILL
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
    <div 
      className="relative overflow-hidden bg-zinc-900/60 border border-white/5 rounded-[2.5rem] p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* NÚT TÍCH NHANH BÊN TRÁI */}
      <button 
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={handleQuickFinish}
        className="relative z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:scale-75 transition-transform"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-active:text-white">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      {/* THANH TIẾN ĐỘ CHẢY (HOLD TO FILL) */}
      <div 
        onPointerDown={startHolding} onPointerUp={stopHolding} onPointerLeave={stopHolding}
        className="absolute inset-0 bg-blue-500 transition-all duration-300 pointer-events-auto"
        style={{ width: `${progressPercent}%`, opacity: isHolding ? 0.2 : 0.05 }}
      />

      <div className="relative z-10 flex-1 flex justify-between items-center pointer-events-none">
        <div className="min-w-0 pr-4">
          <h3 className="text-base font-bold tracking-tight text-white/90 truncate">{task.content}</h3>
          <p className="text-[8px] font-black uppercase tracking-widest opacity-20 mt-1">{task.unit || 'mục tiêu'}</p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xl font-black font-mono tracking-tighter">
            {task.doneCount || 0}<span className="opacity-20 mx-0.5">/</span>{task.targetCount}
          </div>
          <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-30">{task.unit || 'LẦN'}</p>
        </div>
      </div>
    </div>
  );
};