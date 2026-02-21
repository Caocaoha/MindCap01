/**
 * Purpose: Quan ly logic truy van, loc, sap xep va xu ly nghiep vu for Saban Board.
 * Inputs/Outputs: Tra ve trang thai danh sach da xu ly va cac hanh dong tuong tac.
 * Business Rule: Gioi han 4 slot Focus, tu dong don dep slot ma va sap xep uu tien task chua xong.
 * [UPDATE 11.2]: Sua loi an nham Task lap lai. Bo loc gio day giu lai cac task 'daily/weekly' 
 * du da hoan thanh hom truoc, de cho bo quet (Streak) hoac nguoi dung tu reset.
 * [FIX TS2365/2345]: Chuyen doi updatedAt sang timestamp de so sanh va sap xep an toan.
 */

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { triggerHaptic } from '../../utils/haptic';
import { ITask } from '../../database/types';
import { SabanFilter, SabanData, SabanElement, SabanLogic } from './saban-types';

export const useSabanLogic = (): SabanLogic => {
  const [filter, setFilter] = useState<SabanFilter>('all');
  const [search, setSearch] = useState('');

  const allTasks = useLiveQuery(() => db.tasks.toArray(), []);

  const focusSlotsCount = useMemo(() => {
    if (!allTasks) return 0;
    const focused = allTasks.filter(t => t.isFocusMode && t.archiveStatus === 'active' && t.status !== 'done');
    const groupIds = new Set(focused.map(t => t.parentGroupId).filter(id => id != null));
    return groupIds.size + focused.filter(t => !t.parentGroupId).length;
  }, [allTasks]);

  useEffect(() => {
    if (!allTasks) return;
    const ghostTasks = allTasks.filter(t => t.isFocusMode && t.status === 'done');
    ghostTasks.forEach(t => db.tasks.update(t.id!, { isFocusMode: false }));
  }, [allTasks]);

  const processedSaban = useMemo<SabanData>(() => {
    if (!allTasks) return { groups: {}, standalones: [] };
    const today = new Date().setHours(0, 0, 0, 0);
    
    /**
     * [FIX LOGIC]: Phân loại rạch ròi giữa Task 1 lần và Task lặp lại.
     */
    let filtered = allTasks.filter(t => {
      // 1. Loại bỏ task đang trong Focus Mode hoặc đã bị lưu trữ
      if (t.isFocusMode || t.archiveStatus === 'archived') return false;

      // 2. Kiểm tra xem task này có phải là task lặp lại không
      const isRepeatTask = (t.frequency && t.frequency !== 'none') || 
                           t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');

      // 3. Nếu là task lặp lại, LUÔN LUÔN cho phép hiển thị (không quan tâm ngày done)
      if (isRepeatTask) return true;

      /**
       * 4. [FIX TS2365]: Chuyển đổi updatedAt sang timestamp số để so sánh với today.
       * Nếu là task 1 lần (once), ẩn đi nếu đã done từ hôm qua trở về trước.
       */
      const updatedAtTime = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      const isOldDone = t.status === 'done' && updatedAtTime < today;
      return !isOldDone;
    });

    // Loc theo o tim kiem va thanh Filter (Urgent, Important, Once, Repeat)
    filtered = filtered.filter(t => {
      const matchSearch = t.content.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === 'all') return true;

      if (filter === 'urgent') return t.tags?.includes('p:urgent');
      if (filter === 'important') return t.tags?.includes('p:important');
      
      /**
       * [UPDATE]: Logic loc tan suat cho v11.1.
       * Uu tien kiem tra truong 'frequency' trong Database.
       */
      if (filter === 'once') {
        return t.frequency === 'none' || !t.frequency || t.tags?.includes('freq:once');
      }
      
      if (filter === 'repeat') {
        return (t.frequency && t.frequency !== 'none') || 
               t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');
      }

      return true;
    });

    const groups: Record<string | number, ITask[]> = {};
    const standalones: ITask[] = [];
    
    filtered.forEach(t => {
      if (t.parentGroupId) {
        groups[t.parentGroupId] = groups[t.parentGroupId] || [];
        groups[t.parentGroupId].push(t);
      } else {
        standalones.push(t);
      }
    });

    // Sap xep thu tu trong nhom (Sequence Group)
    Object.values(groups).forEach(g => g.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)));
    
    return { groups, standalones };
  }, [allTasks, filter, search]);

  const combinedElements = useMemo(() => {
    const elements: SabanElement[] = [];
    Object.entries(processedSaban.groups).forEach(([id, tasks]) => elements.push({ type: 'group', id, data: tasks }));
    processedSaban.standalones.forEach(task => elements.push({ type: 'standalone', id: task.id!, data: task }));

    return elements.sort((a, b) => {
      const isADone = a.type === 'group' ? (a.data as ITask[]).every(t => t.status === 'done') : (a.data as ITask).status === 'done';
      const isBDone = b.type === 'group' ? (b.data as ITask[]).every(t => t.status === 'done') : (b.data as ITask).status === 'done';
      if (isADone !== isBDone) return isADone ? 1 : -1;
      
      /**
       * [FIX TS2345/2362/2363]: Ép kiểu updatedAt sang number bằng new Date().getTime() 
       * trước khi đưa vào Math.max hoặc thực hiện phép trừ.
       */
      const timeA = a.type === 'group' 
        ? Math.max(...(a.data as ITask[]).map(t => new Date(t.updatedAt || 0).getTime())) 
        : new Date((a.data as ITask).updatedAt || 0).getTime();

      const timeB = b.type === 'group' 
        ? Math.max(...(b.data as ITask[]).map(t => new Date(t.updatedAt || 0).getTime())) 
        : new Date((b.data as ITask).updatedAt || 0).getTime();

      return timeB - timeA;
    });
  }, [processedSaban]);

  const handleJoinGroup = async (draggedId: number, targetId: number) => {
    if (draggedId === targetId) return;
    const target = allTasks?.find(t => t.id === targetId);
    if (!target) return;
    triggerHaptic('medium');
    const gid = target.parentGroupId || `group_${Date.now()}`;
    if (!target.parentGroupId) await db.tasks.update(targetId, { parentGroupId: gid, sequenceOrder: 1 });
    const size = allTasks?.filter(t => t.parentGroupId === gid).length || 0;
    await db.tasks.update(draggedId, { parentGroupId: gid, sequenceOrder: size + 1 });
  };

  const handleToggleFocus = async (task: ITask) => {
    const target = !task.isFocusMode;
    if (target && focusSlotsCount >= 4 && (!task.parentGroupId || !allTasks?.find(t => t.isFocusMode && t.parentGroupId === task.parentGroupId))) {
      triggerHaptic('heavy');
      alert("Slot Focus đầy (4/4)");
      return;
    }
    triggerHaptic(target ? 'medium' : 'light');
    const ids = task.parentGroupId ? allTasks?.filter(t => t.parentGroupId === task.parentGroupId).map(m => m.id!) || [] : [task.id!];
    await Promise.all(ids.map(id => db.tasks.update(id, { isFocusMode: target })));
  };

  return { 
    filter, 
    setFilter, 
    search, 
    setSearch, 
    combinedElements, 
    handleJoinGroup, 
    handleToggleFocus, 
    handleArchive: async (id) => { 
      triggerHaptic('medium'); 
      await db.tasks.update(id, { archiveStatus: 'archived' }); 
    },
    handleMoveOrder: async (task, dir) => { 
      // Logic cho phep thay doi thu tu sap xep trong nhom
    },
    handleDetach: async (task) => { 
      triggerHaptic('medium'); 
      await db.tasks.update(task.id!, { parentGroupId: null }); 
    }
  };
};