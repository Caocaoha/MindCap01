/**
 * Purpose: Giao dien bang Saban (Backlog chien luoc) hien thi nhiem vu va nhom.
 * Inputs/Outputs: Nhan du lieu tu useSabanLogic va render cac TaskCard/Group.
 * Business Rule: Sap xep uu tien task chua xong len dau, ho tro loc va tim kiem.
 * [UPDATE]: Dam bao truyen dan nguyen ven du lieu ITask de TaskCard hien thi Tan suat.
 */

import React, { useState, useRef } from 'react';
import { TaskCard } from './ui/task-card';
import { triggerHaptic } from '../../utils/haptic';
import { useSabanLogic } from './saban-logic';
import { ITask } from '../../database/types';
import { SabanFilter } from './saban-types';

export const SabanBoard: React.FC = () => {
  const logic = useSabanLogic();

  // [NEW]: State quản lý hiển thị Header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /**
   * [NEW]: Xử lý sự kiện cuộn để ẩn/hiện Header
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Bỏ qua nếu cuộn quá ít (tránh jitter) hoặc cuộn nảy (elastic scrolling)
    if (Math.abs(currentScrollY - lastScrollY.current) < 5) return;
    if (currentScrollY < 0) return;

    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      // Đang cuộn xuống & đã qua ngưỡng đỉnh -> Ẩn Header
      setIsHeaderVisible(false);
    } else {
      // Đang cuộn lên hoặc ở đỉnh -> Hiện Header
      setIsHeaderVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* [HEADER]: Dynamic Sticky Header */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-4 transition-transform duration-300 ease-in-out shadow-sm ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'urgent', 'important', 'once', 'repeat'] as SabanFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { triggerHaptic('light'); logic.setFilter(f); }}
                className={`px-4 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  logic.filter === f 
                    ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'urgent' ? 'Khẩn cấp' : f === 'important' ? 'Quan trọng' : f === 'once' ? 'Một lần' : 'Lặp lại'}
              </button>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm kế hoạch..." 
            value={logic.search}
            onChange={(e) => logic.setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[6px] py-2.5 px-4 text-sm focus:outline-none focus:border-[#2563EB] transition-all"
          />
        </div>
      </div>

      {/* [MAIN CONTENT]: Scrollable Area */}
      <main 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col items-stretch space-y-4 pt-36 pb-24 px-1 custom-scrollbar scroll-smooth"
      >
        {logic.combinedElements.map((el) => (
          el.type === 'group' ? (
            <div key={el.id} className="p-2 border border-slate-100 bg-slate-50/30 rounded-[8px] space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sequence Group</span>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  {(el.data as ITask[]).length} Tasks
                </span>
              </div>
              {(el.data as ITask[]).map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isGrouped={true}
                  onToggleFocus={() => logic.handleToggleFocus(task)}
                  onArchive={() => logic.handleArchive(task.id!)}
                  onMoveUp={() => logic.handleMoveOrder(task, 'up')}
                  onMoveDown={() => logic.handleMoveOrder(task, 'down')}
                  onDetach={() => logic.handleDetach(task)}
                  onJoinGroup={logic.handleJoinGroup}
                  isFirst={index === 0}
                  isLast={index === (el.data as ITask[]).length - 1}
                />
              ))}
            </div>
          ) : (
            <TaskCard 
              key={el.id} 
              // [LOGIC CHECK]: Đảm bảo el.data (ITask) chứa đầy đủ frequency/repeatOn
              task={el.data as ITask} 
              onToggleFocus={() => logic.handleToggleFocus(el.data as ITask)}
              onArchive={() => logic.handleArchive((el.data as ITask).id!)}
              onJoinGroup={logic.handleJoinGroup}
            />
          )
        ))}
        
        {logic.combinedElements.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Không có dữ liệu kế hoạch</span>
          </div>
        )}
      </main>
    </div>
  );
};