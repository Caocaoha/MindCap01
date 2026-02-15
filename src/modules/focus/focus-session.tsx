import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';

/**
 * [MOD_FOCUS]: Chế độ thực thi tập trung v4.5.
 * Giai đoạn 6.7: Tích hợp Group Task Slot-Sharing (Chỉ hiện bước tiếp theo).
 */
export const FocusSession: React.FC = () => {
  /**
   * [LOGIC CHỌN VIỆC]: Thực hiện gom nhóm và lọc "Bước tiếp theo" ngay trong Query.
   * Đảm bảo một nhóm chỉ chiếm 01 slot duy nhất.
   */
  const focusDisplayTasks = useLiveQuery(async () => {
    const allInFocus = await db.tasks
      .toCollection()
      .filter(t => t.isFocusMode === true && t.archiveStatus === 'active')
      .toArray();

    const slots: (ITask & { groupInfo?: { current: number; total: number } })[] = [];
    const seenGroups = new Set<string | number>();

    // Sắp xếp toàn bộ theo thời gian cập nhật để giữ thứ tự ưu tiên từ Saban
    allInFocus.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    allInFocus.forEach(task => {
      if (slots.length >= 4) return;

      if (!task.parentGroupId) {
        // Việc đơn: Chiếm 1 slot
        slots.push(task);
      } else if (!seenGroups.has(task.parentGroupId)) {
        // Việc thuộc nhóm: Tìm "Bước tiếp theo" trong nhóm này
        seenGroups.add(task.parentGroupId);
        
        const groupMembers = allInFocus
          .filter(m => m.parentGroupId === task.parentGroupId)
          .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

        // Tìm tiểu nhiệm vụ đầu tiên chưa hoàn thành trong Focus
        const nextTask = groupMembers.find(m => m.status !== 'done') || groupMembers[0];
        
        // Đính kèm metadata về tiến trình nhóm
        const completedCount = groupMembers.filter(m => m.status === 'done').length;
        
        slots.push({
          ...nextTask,
          groupInfo: {
            current: completedCount + 1,
            total: groupMembers.length
          }
        });
      }
    });

    return slots;
  }, []);

  // EMPTY STATE: Phong cách Linear phẳng
  if (!focusDisplayTasks || focusDisplayTasks.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Deep Work Session</p>
        <p className="text-[9px] mt-2 text-slate-300 italic">Chọn việc từ Saban để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white min-h-full pb-32">
      <header className="px-2 flex justify-between items-end border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-slate-900">FOCUS</h2>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Thực thi mục tiêu</p>
        </div>
        {/* Chỉ số slot đang dùng */}
        <div className="text-[10px] font-black text-slate-300">
          {focusDisplayTasks.length} / 4 SLOTS
        </div>
      </header>

      <div className="space-y-3">
        {focusDisplayTasks.map(task => (
          <FocusCard 
            key={task.id} 
            task={task} 
            groupInfo={task.groupInfo} 
          />
        ))}
      </div>
    </div>
  );
};

/**
 * [FOCUS_CARD]: Thẻ thực thi nâng cấp hỗ trợ Group Indicator.
 */
const FocusCard: React.FC<{ task: ITask, groupInfo?: { current: number; total: number } }> = ({ task, groupInfo }) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<any>(null);
  const touchStartY = useRef<number>(0);
  const lastUpdate = useRef<number>(0);

  // LOGIC CẬP NHẬT CHÍNH: Tích hợp ghi nhận Habit Log & Score.
  const updateProgress = async (newCount: number, forceComplete = false) => {
    const now = Date.now();
    if (now - lastUpdate.current < 50 && !forceComplete) return;
    lastUpdate.current = now;

    const target = task.targetCount || 1;
    const finalCount = forceComplete ? target : Math.max(0, Math.min(newCount, target));
    const isActuallyDone = forceComplete || finalCount >= target;

    // Chuẩn bị Completion Log nếu hoàn thành
    const updatedLog = isActuallyDone 
      ? [...(task.completionLog || []), now] 
      : (task.completionLog || []);

    await db.tasks.update(task.id!, {
      doneCount: finalCount,
      status: isActuallyDone ? 'done' : 'todo',
      // Nếu xong thì thoát Focus, nếu chưa xong thì ở lại
      isFocusMode: !isActuallyDone, 
      updatedAt: now,
      completionLog: updatedLog,
      interactionScore: (task.interactionScore || 0) + (isActuallyDone ? 10 : 0)
    });

    if (isActuallyDone) triggerHaptic('success');
    else triggerHaptic('light');
  };

  // NÚT TÍCH NHANH
  const handleQuickFinish = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); 
    triggerHaptic('success');
    updateProgress(task.targetCount || 1, true);
  };

  // CỬ CHỈ VUỐT & CHẠM
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
      className={`relative overflow-hidden bg-white border border-slate-200 rounded-[6px] p-5 flex items-start gap-4 transition-all active:scale-[0.98] ${isHolding ? 'border-blue-200' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* NÚT TÍCH NHANH */}
      <button 
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={handleQuickFinish}
        className="relative z-20 w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[6px] bg-slate-50 border border-slate-100 active:scale-75 transition-transform mt-0.5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>

      {/* THANH TIẾN ĐỘ CHẢY */}
      <div 
        onPointerDown={startHolding} onPointerUp={stopHolding} onPointerLeave={stopHolding}
        className="absolute inset-0 bg-[#2563EB] transition-all duration-300 pointer-events-auto"
        style={{ width: `${progressPercent}%`, opacity: isHolding ? 0.15 : 0.05 }}
      />

      <div className="relative z-10 flex-1 flex justify-between items-start pointer-events-none">
        <div className="min-w-0 pr-4">
          {/* STEP INDICATOR: Chỉ hiện khi thuộc một nhóm */}
          {groupInfo && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                Step {groupInfo.current} / {groupInfo.total}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: groupInfo.total }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 h-1 rounded-full ${i < groupInfo.current - 1 ? 'bg-blue-600' : i === groupInfo.current - 1 ? 'bg-blue-400 animate-pulse' : 'bg-slate-100'}`} 
                  />
                ))}
              </div>
            </div>
          )}

          <h3 className="text-base font-bold tracking-tight text-slate-900 break-words whitespace-pre-wrap leading-relaxed">
            {task.content}
          </h3>
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-2">
            {task.unit || 'mục tiêu'}
          </p>
        </div>

        {/* CHỈ SỐ TIẾN ĐỘ ĐỊNH LƯỢNG */}
        <div className="text-right shrink-0 mt-0.5">
          <div className="text-xl font-bold font-mono tracking-tighter text-slate-900">
            {task.doneCount || 0}<span className="text-slate-200 mx-0.5">/</span>{task.targetCount}
          </div>
          <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-300">
            {task.unit || 'LẦN'}
          </p>
        </div>
      </div>
    </div>
  );
};