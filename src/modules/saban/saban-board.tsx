import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { TaskCard } from './ui/task-card';
import { triggerHaptic } from '../../utils/haptic';
import { ITask } from '../../database/types';

// Định nghĩa interface cho dữ liệu đã xử lý để đảm bảo tính nhất quán của Type
interface SabanData {
  groups: Record<string | number, ITask[]>;
  standalones: ITask[];
}

/**
 * [MOD_SABAN]: Quản lý backlog chiến lược v4.4.
 * Giai đoạn 6.6: Tối ưu hóa Sắp xếp (Unfinished > Finished) và Lọc thời gian thực.
 */
export const SabanBoard: React.FC = () => {
  // --- 1. STATES BẢO TỒN (Lọc & Tìm kiếm) ---
  const [filter, setFilter] = useState<'all' | 'urgent' | 'important' | 'once' | 'repeat'>('all');
  const [search, setSearch] = useState('');

  // --- 2. TRUY VẤN DỮ LIỆU SỐNG ---
  const allTasks = useLiveQuery(async () => {
    return await db.tasks.toArray();
  }, []);

  /**
   * [FOCUS GUARD]: Tính toán slot đang dùng (Giới hạn 4).
   */
  const focusSlotsCount = useMemo(() => {
    if (!allTasks) return 0;
    const focused = allTasks.filter(t => t.isFocusMode && t.archiveStatus === 'active');
    const groupIds = new Set(focused.map(t => t.parentGroupId).filter(id => id !== null && id !== undefined));
    const singleTasks = focused.filter(t => !t.parentGroupId);
    return groupIds.size + singleTasks.length;
  }, [allTasks]);

  /**
   * [CORE LOGIC]: Xử lý Lọc và Sắp xếp ưu tiên (v4.4).
   * Ưu tiên việc chưa xong lên đầu, việc xong trong ngày xuống cuối.
   */
  const processedSaban = useMemo<SabanData>(() => {
    if (!allTasks) return { groups: {}, standalones: [] };
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // BƯỚC 1: Lọc trạng thái (Chưa vào Focus & Đang hoạt động & (Chưa xong HOẶC Xong hôm nay))
    let filtered = allTasks.filter(t => {
      const isActive = t.isFocusMode === false && t.archiveStatus === 'active';
      if (!isActive) return false;

      // Logic: Việc đã xong từ hôm qua trở về trước thì bỏ hiển thị
      const isDoneBeforeToday = t.status === 'done' && (t.updatedAt || 0) < todayStart;
      return !isDoneBeforeToday;
    });

    // BƯỚC 2: Áp dụng bộ lọc Search & Category (Bảo tồn 100%)
    filtered = filtered.filter(t => {
      const matchSearch = t.content.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filter === 'all') return true;
      if (filter === 'urgent') return t.tags?.includes('p:urgent');
      if (filter === 'important') return t.tags?.includes('p:important');
      if (filter === 'once') return t.tags?.includes('freq:once');
      if (filter === 'repeat') return t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');
      return true;
    });

    // BƯỚC 3: Gom nhóm và Phân loại
    const groups: Record<string | number, ITask[]> = {};
    const standalones: ITask[] = [];

    filtered.forEach(t => {
      if (t.parentGroupId) {
        if (!groups[t.parentGroupId]) groups[t.parentGroupId] = [];
        groups[t.parentGroupId].push(t);
      } else {
        standalones.push(t);
      }
    });

    // Sắp xếp nội bộ nhóm (theo sequenceOrder)
    Object.keys(groups).forEach(gid => {
      groups[gid].sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    });

    return { groups, standalones };
  }, [allTasks, filter, search]);

  /**
   * [SORTING HELPER]: Xác định thứ tự hiển thị toàn bảng.
   * Một nhóm được coi là "Xong" nếu toàn bộ thành viên đều xong.
   */
  const sortSabanElements = (elements: { type: 'group' | 'standalone', id: string | number, data: any }[]) => {
    return elements.sort((a, b) => {
      const isADone = a.type === 'group' 
        ? (a.data as ITask[]).every(t => t.status === 'done') 
        : (a.data as ITask).status === 'done';
      
      const isBDone = b.type === 'group' 
        ? (b.data as ITask[]).every(t => t.status === 'done') 
        : (b.data as ITask).status === 'done';

      // Việc chưa xong (-1) lên trên, Việc đã xong (1) xuống dưới
      if (!isADone && isBDone) return -1;
      if (isADone && !isBDone) return 1;

      // Nếu cùng trạng thái, sắp xếp theo thời gian cập nhật mới nhất
      const timeA = a.type === 'group' ? Math.max(...a.data.map((t: ITask) => t.updatedAt || 0)) : (a.data as ITask).updatedAt || 0;
      const timeB = b.type === 'group' ? Math.max(...b.data.map((t: ITask) => t.updatedAt || 0)) : (b.data as ITask).updatedAt || 0;
      return timeB - timeA;
    });
  };

  // Tạo danh sách tổng hợp để sắp xếp đồng nhất
  const combinedElements = useMemo(() => {
    const elements: { type: 'group' | 'standalone', id: string | number, data: any }[] = [];
    Object.entries(processedSaban.groups).forEach(([id, tasks]) => {
      elements.push({ type: 'group', id, data: tasks });
    });
    processedSaban.standalones.forEach(task => {
      elements.push({ type: 'standalone', id: task.id!, data: task });
    });
    return sortSabanElements(elements);
  }, [processedSaban]);

  // --- HANDLERS BẢO TỒN 100% ---
  const handleJoinGroup = async (draggedId: number, targetId: number) => {
    if (draggedId === targetId) return;
    const draggedTask = allTasks?.find(t => t.id === draggedId);
    const targetTask = allTasks?.find(t => t.id === targetId);
    if (!draggedTask || !targetTask) return;
    triggerHaptic('medium');
    if (targetTask.parentGroupId) {
      const groupSize = allTasks?.filter(t => t.parentGroupId === targetTask.parentGroupId).length || 0;
      await db.tasks.update(draggedId, { parentGroupId: targetTask.parentGroupId, sequenceOrder: groupSize + 1 });
    } else {
      const newGroupId = `group_${Date.now()}`;
      await db.tasks.update(targetId, { parentGroupId: newGroupId, sequenceOrder: 1 });
      await db.tasks.update(draggedId, { parentGroupId: newGroupId, sequenceOrder: 2 });
    }
  };

  const handleToggleFocus = async (task: ITask) => {
    const targetMode = !task.isFocusMode;
    if (targetMode) {
      const isNewSlot = !task.parentGroupId || !allTasks?.find(t => t.isFocusMode && t.parentGroupId === task.parentGroupId);
      if (isNewSlot && focusSlotsCount >= 4) {
        triggerHaptic('heavy');
        alert("Sức chứa tập trung đã đầy (4/4). Hãy hoàn thành hoặc gỡ bỏ bớt việc.");
        await db.tasks.update(task.id!, { updatedAt: Date.now() + 1000 });
        return;
      }
    }
    triggerHaptic(targetMode ? 'medium' : 'light');
    if (task.parentGroupId) {
      const groupMembers = allTasks?.filter(t => t.parentGroupId === task.parentGroupId) || [];
      await Promise.all(groupMembers.map(m => db.tasks.update(m.id!, { isFocusMode: targetMode })));
    } else {
      await db.tasks.update(task.id!, { isFocusMode: targetMode });
    }
  };

  const handleArchive = async (id: number) => {
    triggerHaptic('medium');
    await db.tasks.update(id, { archiveStatus: 'archived' });
    const task = allTasks?.find(t => t.id === id);
    if (task?.parentGroupId) {
      const siblings = allTasks?.filter(t => t.parentGroupId === task.parentGroupId && t.id !== id && t.archiveStatus === 'active');
      if (siblings && siblings.length === 1) {
        await db.tasks.update(siblings[0].id!, { parentGroupId: null, sequenceOrder: 0 });
      }
    }
  };

  const handleMoveOrder = async (task: ITask, direction: 'up' | 'down') => {
    if (!task.parentGroupId) return;
    const groupMembers = allTasks?.filter(t => t.parentGroupId === task.parentGroupId && t.archiveStatus === 'active').sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    if (!groupMembers) return;
    const currentIndex = groupMembers.findIndex(t => t.id === task.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < groupMembers.length) {
      const targetTask = groupMembers[targetIndex];
      const currentOrder = task.sequenceOrder || 0;
      const targetOrder = targetTask.sequenceOrder || 0;
      await db.tasks.update(task.id!, { sequenceOrder: targetOrder });
      await db.tasks.update(targetTask.id!, { sequenceOrder: currentOrder });
      triggerHaptic('light');
    }
  };

  const handleDetach = async (task: ITask) => {
    triggerHaptic('medium');
    await db.tasks.update(task.id!, { parentGroupId: null, sequenceOrder: 0 });
    const siblings = allTasks?.filter(t => t.parentGroupId === task.parentGroupId && t.id !== task.id && t.archiveStatus === 'active');
    if (siblings && siblings.length === 1) {
      await db.tasks.update(siblings[0].id!, { parentGroupId: null, sequenceOrder: 0 });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 bg-white">
      <header className="space-y-4 px-1">
        <div className="flex flex-wrap gap-2">
          {(['all', 'urgent', 'important', 'once', 'repeat'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { triggerHaptic('light'); setFilter(f); }}
              className={`px-4 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border transition-all ${
                filter === f ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-none' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 shadow-none'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'urgent' ? 'Khẩn cấp' : f === 'important' ? 'Quan trọng' : f === 'once' ? 'Một lần' : 'Lặp lại'}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Tìm kiếm kế hoạch..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-[6px] py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#2563EB] transition-all shadow-none"
        />
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col items-stretch space-y-4 pb-24 custom-scrollbar">
        {combinedElements.map((el) => {
          if (el.type === 'group') {
            const groupTasks = el.data as ITask[];
            return (
              <div key={el.id} className="p-2 border border-slate-100 bg-slate-50/30 rounded-[8px] space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sequence Group</span>
                  <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{groupTasks.length} Tasks</span>
                </div>
                {groupTasks.map((task, index) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isGrouped={true}
                    onToggleFocus={() => handleToggleFocus(task)}
                    onArchive={() => handleArchive(task.id!)}
                    onMoveUp={() => handleMoveOrder(task, 'up')}
                    onMoveDown={() => handleMoveOrder(task, 'down')}
                    onDetach={() => handleDetach(task)}
                    onJoinGroup={handleJoinGroup}
                    isFirst={index === 0}
                    isLast={index === groupTasks.length - 1}
                  />
                ))}
              </div>
            );
          } else {
            const task = el.data as ITask;
            return (
              <TaskCard 
                key={task.id} 
                task={task} 
                onToggleFocus={() => handleToggleFocus(task)}
                onArchive={() => handleArchive(task.id!)}
                onJoinGroup={handleJoinGroup}
              />
            );
          }
        })}
        
        {combinedElements.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[6px] bg-slate-50/50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
              Không có dữ liệu kế hoạch
            </span>
          </div>
        )}
      </main>
    </div>
  );
};