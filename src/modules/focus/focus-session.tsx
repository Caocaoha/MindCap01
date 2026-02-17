import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { triggerHaptic } from '../../utils/haptic';
// [NEW]: Import FocusItem mới đã cập nhật
import { FocusItem } from './components/focus-item';

/**
 * [MOD_FOCUS]: Chế độ thực thi tập trung v4.7 - Modern Card Layout Integration.
 * Giai đoạn 6.37: Cập nhật Container để hỗ trợ giao diện thẻ bài (Card-based).
 * Chỉ kích hoạt trạng thái 'Active' (Nền trắng) cho Task đầu tiên.
 */
export const FocusSession: React.FC = () => {
  /**
   * [LOGIC CHỌN VIỆC]:
   * Sắp xếp theo 'createdAt' để danh sách KHÔNG bị nhảy khi update tiến độ.
   */
  const focusDisplayTasks = useLiveQuery(async () => {
    const allInFocus = await db.tasks
      .toCollection()
      // [FIX]: Bổ sung điều kiện status !== 'done' để loại bỏ task hoàn thành ngay lập tức
      .filter(t => t.isFocusMode === true && t.archiveStatus === 'active' && t.status !== 'done')
      .toArray();

    const slots: (ITask & { groupInfo?: { current: number; total: number } })[] = [];
    const seenGroups = new Set<string | number>();

    // [FIX]: Đổi logic sort từ updatedAt sang createdAt để cố định vị trí
    // Mới vào xếp dưới cùng -> Sort tăng dần theo thời gian tạo (Cũ trên, Mới dưới)
    allInFocus.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    allInFocus.forEach(task => {
      // Logic Slots giữ nguyên (Max 4 slots)
      if (slots.length >= 4) return;

      if (!task.parentGroupId) {
        slots.push(task);
      } else if (!seenGroups.has(task.parentGroupId)) {
        seenGroups.add(task.parentGroupId);
        
        const groupMembers = allInFocus
          .filter(m => m.parentGroupId === task.parentGroupId)
          .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

        const nextTask = groupMembers.find(m => m.status !== 'done') || groupMembers[0];
        
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

  if (!focusDisplayTasks || focusDisplayTasks.length === 0) {
    return (
      // [STYLE UPDATE]: Bo góc 12px để đồng bộ với thiết kế Card mới
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[12px] bg-slate-50/50">
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
        <div className="text-[10px] font-black text-slate-300">
          {focusDisplayTasks.length} / 4 SLOTS
        </div>
      </header>

      {/* Container danh sách: Sử dụng space-y-3 (12px) đúng theo thiết kế */}
      <div className="space-y-3">
        {focusDisplayTasks.map((task, index) => (
          // [FIX]: Truyền trực tiếp object task xuống con để đảm bảo hiển thị
          // [LOGIC VISUAL]: Chỉ task đầu tiên (index === 0) mới là Active (Nền trắng/Nổi).
          // Các task sau sẽ là Inactive (Nền xám/Chìm).
          <FocusItem 
            key={task.id} 
            task={task} 
            isActive={index === 0} 
          />
        ))}
      </div>
    </div>
  );
};