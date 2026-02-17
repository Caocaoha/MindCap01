/**
 * Purpose: Quan ly logic truy van, loc, sap xep va xu ly nghiep vu cho Saban Board.
 * Inputs/Outputs: Tra ve trang thai danh sach da xu ly va cac hanh dong tuong tac.
 * Business Rule: Gioi han 4 slot Focus, tu dong don dep slot ma va sap xep uu tien task chua xong.
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
    let filtered = allTasks.filter(t => t.isFocusMode === false && t.archiveStatus === 'active' && !(t.status === 'done' && (t.updatedAt || 0) < today));

    filtered = filtered.filter(t => {
      const match = t.content.toLowerCase().includes(search.toLowerCase());
      if (!match || filter === 'all') return match;
      if (filter === 'urgent') return t.tags?.includes('p:urgent');
      if (filter === 'important') return t.tags?.includes('p:important');
      if (filter === 'once') return t.tags?.includes('freq:once');
      return t.tags?.some(tag => tag.startsWith('freq:') && tag !== 'freq:once');
    });

    const groups: Record<string | number, ITask[]> = {};
    const standalones: ITask[] = [];
    filtered.forEach(t => t.parentGroupId ? (groups[t.parentGroupId] = groups[t.parentGroupId] || [], groups[t.parentGroupId].push(t)) : standalones.push(t));
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
      const timeA = a.type === 'group' ? Math.max(...(a.data as ITask[]).map(t => t.updatedAt || 0)) : (a.data as ITask).updatedAt || 0;
      const timeB = b.type === 'group' ? Math.max(...(b.data as ITask[]).map(t => t.updatedAt || 0)) : (b.data as ITask).updatedAt || 0;
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
      alert("Slot Focus day (4/4)");
      return;
    }
    triggerHaptic(target ? 'medium' : 'light');
    const ids = task.parentGroupId ? allTasks?.filter(t => t.parentGroupId === task.parentGroupId).map(m => m.id!) || [] : [task.id!];
    await Promise.all(ids.map(id => db.tasks.update(id, { isFocusMode: target })));
  };

  return { filter, setFilter, search, setSearch, combinedElements, handleJoinGroup, handleToggleFocus, 
           handleArchive: async (id) => { triggerHaptic('medium'); await db.tasks.update(id, { archiveStatus: 'archived' }); },
           handleMoveOrder: async (task, dir) => { /* Logic rut gon giua cac phan tu nhom */ },
           handleDetach: async (task) => { triggerHaptic('medium'); await db.tasks.update(task.id!, { parentGroupId: null }); }
  };
};