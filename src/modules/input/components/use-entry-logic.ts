/**
 * Purpose: Quan ly toan bo logic, trang thai va luu tru cho Entry Form (v9.5).
 * Inputs/Outputs: Tra ve trang thai (State) va cac ham xu ly (Handlers) cho UI.
 * Business Rule: 
 * - [MIGRATION]: Chuyen doi vat ly giua Task/Thought thong qua Transaction.
 * - [SOURCE]: Gan sourceTable vinh vien de phuc vu dong bo Obsidian Bridge.
 * - [SMART ROUTING]: Tu dong day vao Focus (max 4) neu Saban Todo dang trong.
 * - [NOTIFICATION]: [FIXED] Phản hồi cho mọi trường hợp lưu trữ với thông báo tương tác.
 */

import { useState, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { useNotificationStore } from '../../../store/notification-store';
import { NotificationManager } from '../../spark/notification-manager';
import { EntryFormProps, EntryType, FrequencyType, EntryLogic } from './entry-types';
import { ITask, IThought } from '../../../database/types';

export const useEntryLogic = (props: EntryFormProps): EntryLogic => {
  const { initialData, onSuccess, onCustomSave } = props;
  const { setSearchQuery, searchQuery, parsedQuantity, parsedUnit, parsedFrequency, openEditModal } = useUiStore();
  const { showNotification } = useNotificationStore();

  const [entryType, setEntryType] = useState<EntryType>('task');
  const [content, setContent] = useState('');
  const [targetCount, setTargetCount] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [freq, setFreq] = useState<FrequencyType>('once');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [moodLevel, setMoodLevel] = useState<number>(3);

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      // Xac dinh loai dua tren thuoc tinh status hoac sourceTable
      const isTaskRecord = 'status' in initialData || initialData.sourceTable === 'tasks';
      
      if (isTaskRecord) {
        setEntryType('task');
        setTargetCount((initialData as ITask).targetCount || 1);
        setUnit((initialData as ITask).unit || '');
        setIsUrgent(initialData.tags?.includes('p:urgent') || false);
        setIsImportant(initialData.tags?.includes('p:important') || false);
        const fTag = initialData.tags?.find(t => t.startsWith('freq:'));
        if (fTag) setFreq(fTag.split(':')[1] as any);
        setSelectedWeekDays(initialData.tags?.filter(t => t.startsWith('d:')).map(t => parseInt(t.split(':')[1])) || []);
        setSelectedMonthDays(initialData.tags?.filter(t => t.startsWith('m:')).map(t => parseInt(t.split(':')[1])) || []);
      } else {
        setEntryType('thought');
      }
    } else if (searchQuery) setContent(searchQuery);
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;
    if (parsedQuantity !== null) setTargetCount(parsedQuantity);
    if (parsedUnit !== null) setUnit(parsedUnit);
    if (parsedFrequency) {
      const f = parsedFrequency.toLowerCase();
      if (f.includes('ngay')) { setFreq('weekly'); setSelectedWeekDays([1, 2, 3, 4, 5, 6, 7]); }
      else if (f.includes('tuan')) setFreq('weekly');
      else if (f.includes('thang')) setFreq('days-month');
    }
  }, [parsedQuantity, parsedUnit, parsedFrequency, initialData]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!initialData) setSearchQuery(val, 'mind');
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const now = Date.now();
    const wordCount = content.trim().split(/\s+/).length;
    
    // Logic xac dinh su thay doi bang du lieu
    const wasTask = initialData && ('status' in initialData || initialData.sourceTable === 'tasks');
    const isNowTask = entryType === 'task';
    const hasTypeChanged = initialData?.id && ((wasTask && !isNowTask) || (!wasTask && isNowTask));
    const isNew = !initialData?.id;

    /**
     * [SMART ROUTING LOGIC]: Kiểm tra trạng thái Saban và Focus
     */
    let targetFocusMode = false;
    let routingMessage = "📥 Đã thêm nhiệm vụ vào Saban Todo.";

    // Logic này sẽ chạy khi tạo mới Task HOẶC chuyển đổi từ Nhật ký sang Task
    if (isNowTask && (isNew || hasTypeChanged)) {
      const todoActiveCount = await db.tasks
        .where('isFocusMode').equals(0) // false
        .and(t => t.archiveStatus === 'active' && t.status !== 'done')
        .count();
      
      const focusSlotsCount = await db.tasks
        .where('isFocusMode').equals(1) // true
        .and(t => t.status !== 'done')
        .count();

      // Neu Todo dang trong va Focus chua day 4 slot
      if (todoActiveCount === 0 && focusSlotsCount < 4) {
        targetFocusMode = true;
        routingMessage = "🚀 Saban đang trống, task đã được đẩy thẳng vào Focus!";
      } else if (focusSlotsCount >= 4 && todoActiveCount === 0) {
        routingMessage = "📥 Đã thêm vào Saban Todo (Focus đã đầy 4/4).";
      }
    }

    let payload: any;
    if (isNowTask) {
      const tags = [`freq:${freq}`, isUrgent ? 'p:urgent' : '', isImportant ? 'p:important' : '', 
                    ...selectedWeekDays.map(d => `d:${d}`), ...selectedMonthDays.map(m => `m:${m}`)].filter(Boolean);
      payload = {
        content: content.trim(), 
        status: (initialData as ITask)?.status || 'todo',
        createdAt: initialData?.createdAt || now, 
        updatedAt: now, 
        targetCount, 
        unit: unit.trim(),
        tags, 
        parentId: initialData?.parentId, 
        interactionScore: (initialData?.interactionScore || 0),
        lastInteractedAt: now, 
        // Giữ FocusMode cũ nếu chỉ là chỉnh sửa cùng bảng, ngược lại dùng target tính toán
        isFocusMode: (initialData?.id && !hasTypeChanged) ? (initialData as ITask).isFocusMode : targetFocusMode, 
        archiveStatus: (initialData as ITask)?.archiveStatus || 'active',
        syncStatus: (initialData as ITask)?.syncStatus || 'pending',
        sourceTable: 'tasks'
      };
    } else {
      payload = { 
        content: content.trim(), 
        type: 'thought', 
        wordCount, 
        createdAt: initialData?.createdAt || now, 
        updatedAt: now, 
        parentId: initialData?.parentId, 
        interactionScore: (initialData?.interactionScore || 0),
        syncStatus: (initialData as IThought)?.syncStatus || 'pending',
        sourceTable: 'thoughts'
      };
    }

    // Luu tru ban ghi de phuc vu cho hanh dong 'Sua' trong thong bao
    let savedRecord: any = { ...payload };

    if (onCustomSave) {
      await onCustomSave(entryType, entryType === 'thought' ? { ...payload, moodScore: moodLevel } : payload);
    } else {
      if (hasTypeChanged) {
        // [ATOMIC MIGRATION]: Di cư bản ghi qua Transaction
        const oldTable = wasTask ? db.tasks : db.thoughts;
        const newTable = isNowTask ? db.tasks : db.thoughts;

        await db.transaction('rw', db.tasks, db.thoughts, async () => {
          await oldTable.delete(Number(initialData.id));
          const id = await newTable.add(payload);
          savedRecord.id = id;
        });
      } else if (initialData?.id) {
        await (tableFromType(isNowTask) as any).update(Number(initialData.id), payload);
        savedRecord.id = initialData.id;
      } else {
        const id = await (tableFromType(isNowTask) as any).add(payload);
        savedRecord.id = id;
        if (entryType === 'thought') await db.moods.add({ score: moodLevel, label: 'entry_reflection', createdAt: now });
        if (wordCount > 16) NotificationManager.scheduleWaterfall(Number(id), entryType, content.trim());
      }
    }

    /**
     * [NOTIFICATION DISPATCHER]: Phản hồi thị giác tương tác
     */
    let finalMessage = "✅ Đã cập nhật thành công.";
    
    if (isNew || hasTypeChanged) {
      if (isNowTask) {
        finalMessage = routingMessage;
      } else {
        finalMessage = hasTypeChanged 
          ? "🔄 Đã chuyển đổi thành nhận thức thành công." 
          : "📝 Đã lưu nhận thức vào Nhật ký.";
      }
    }

    // Luôn kích hoạt thông báo tương tác chính giữa màn hình
    showNotification(finalMessage, () => openEditModal(savedRecord));

    if (!initialData) setSearchQuery('', 'mind');
    triggerHaptic('success');
    onSuccess();
  };

  // Helper nội bộ để lấy bảng
  const tableFromType = (isTask: boolean) => isTask ? db.tasks : db.thoughts;

  return {
    entryType, setEntryType, content, setContent, targetCount, setTargetCount,
    unit, setUnit, freq, setFreq, isUrgent, setIsUrgent, isImportant, setIsImportant,
    selectedWeekDays, selectedMonthDays, moodLevel, setMoodLevel,
    toggleWeekDay: (d) => setSelectedWeekDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    toggleMonthDay: (d) => setSelectedMonthDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    handleSave, handleContentChange
  };
};