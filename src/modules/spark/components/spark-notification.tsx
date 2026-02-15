import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../database/db';
import { useUiStore } from '../../../store/ui-store';
import { triggerHaptic } from '../../../utils/haptic';
/** * FIX: Điều chỉnh đường dẫn từ ../../../services/spark/... 
 * thành ../notification-manager để khớp với vị trí file thực tế của bạn.
 */
import { SparkNotificationManager } from '../notification-manager';

/**
 * [MODULE]: Spark Notification - Spotlight Watcher.
 * Hiển thị "mồi câu" cho bản ghi quan trọng nhất đến hạn ôn tập.
 */
export const SparkNotification: React.FC = () => {
  const { isInputFocused, isTyping, openEditModal } = useUiStore();
  const [isDismissed, setIsDismissed] = useState(false);

  /**
   * [SPOTLIGHT QUERY]: Chỉ lấy DUY NHẤT 1 bản ghi ưu tiên nhất.
   * Chiến thuật: Ưu tiên bản ghi đã Bookmark > Bản ghi có nội dung dài nhất.
   */
  const spotlightEntry = useLiveQuery(async () => {
    const now = Date.now();
    
    // Tìm các Task và Thought đã đến hạn
    const dueTasks = await db.tasks.where('nextReviewAt').belowOrEqual(now).toArray();
    const dueThoughts = await db.thoughts.where('nextReviewAt').belowOrEqual(now).toArray();

    const allDue = [...dueTasks, ...dueThoughts];

    if (allDue.length === 0) return null;

    // Sắp xếp tìm Spotlight
    return allDue.sort((a, b) => {
      if (a.isBookmarked && !b.isBookmarked) return -1;
      if (!a.isBookmarked && b.isBookmarked) return 1;
      return (b.content.length || 0) - (a.content.length || 0);
    })[0]; 
  }, []);

  // Điều kiện hiển thị: Có bản ghi đến hạn & Không bận nhập liệu
  const isVisible = spotlightEntry && !isInputFocused && !isTyping && !isDismissed;

  if (!isVisible) return null;

  const handleOpen = () => {
    triggerHaptic('medium');
    openEditModal(spotlightEntry); // Mở Modal chi tiết
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    // Gọi logic Snooze 30 phút
    SparkNotificationManager.snooze(spotlightEntry, 30); 
    setIsDismissed(true);
  };

  return (
    <div 
      onClick={handleOpen}
      className="fixed bottom-24 left-4 right-4 z-[55] animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="bg-[#1E293B] text-white p-4 rounded-[12px] shadow-2xl border border-slate-700 flex flex-col gap-3 group active:scale-[0.98] transition-all">
        
        {/* Header: Trạng thái Watcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Ký ức cần khơi gợi
            </span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mồi câu nội dung */}
        <p className="text-sm font-medium leading-relaxed italic text-slate-200 line-clamp-4">
          "{spotlightEntry.content}"
        </p>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2 mt-1">
          <button 
            onClick={handleSnooze}
            className="px-3 py-1.5 rounded-[6px] text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all uppercase tracking-wider"
          >
            Snooze (30m)
          </button>
          <button 
            className="px-3 py-1.5 rounded-[6px] text-[10px] font-bold bg-[#2563EB] text-white hover:bg-blue-600 transition-all uppercase tracking-wider"
          >
            Đọc tiếp
          </button>
        </div>
      </div>
    </div>
  );
};