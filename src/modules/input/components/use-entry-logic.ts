/**
 * Purpose: Quan ly toan bo logic, trang thai va luu tru cho Entry Form (v9.8).
 * Inputs/Outputs: Tra ve trang thai (State) va cac ham xu ly (Handlers) cho UI.
 * Business Rule: 
 * - [CENTRALIZED]: Chuyển toàn bộ logic điều hướng và lập lịch sang EntryService.
 * - [MIGRATION]: Duy trì tính nguyên tử khi chuyển đổi giữa Task/Thought.
 * - [UNIFIED]: Đảm bảo mọi bản ghi đều đi qua bộ lọc Spark Waterfall (>16 từ).
 */

import { useState, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { useNotificationStore } from '../../../store/notification-store';
import { EntryService } from '../../../services/entry-service'; // [NEW]: Tổng kho điều phối
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

  /**
   * [ACTION]: Lưu trữ thông qua EntryService để kích hoạt Smart Routing và Spark Waterfall.
   */
  const handleSave = async () => {
    if (!content.trim()) return;
    
    const wasTask = initialData && ('status' in initialData || initialData.sourceTable === 'tasks');
    const isNowTask = entryType === 'task';
    const hasTypeChanged = initialData?.id && ((wasTask && !isNowTask) || (!wasTask && isNowTask));

    try {
      // 1. Chuẩn bị Payload theo loại Entry
      let payload: any;
      if (isNowTask) {
        const tags = [
          `freq:${freq}`, 
          isUrgent ? 'p:urgent' : '', 
          isImportant ? 'p:important' : '', 
          ...selectedWeekDays.map(d => `d:${d}`), 
          ...selectedMonthDays.map(m => `m:${m}`)
        ].filter(Boolean);

        payload = {
          id: initialData?.id,
          content: content.trim(), 
          status: (initialData as ITask)?.status || 'todo',
          targetCount, 
          unit: unit.trim(),
          tags, 
          parentId: initialData?.parentId, 
          interactionScore: (initialData?.interactionScore || 0),
          archiveStatus: (initialData as ITask)?.archiveStatus || 'active',
          syncStatus: (initialData as ITask)?.syncStatus || 'pending'
        };
      } else {
        payload = { 
          id: initialData?.id,
          content: content.trim(), 
          type: 'thought', 
          parentId: initialData?.parentId, 
          interactionScore: (initialData?.interactionScore || 0),
          syncStatus: (initialData as IThought)?.syncStatus || 'pending'
        };
      }

      // 2. Xử lý lưu trữ
      let result: any;

      if (onCustomSave) {
        // Trường hợp ghi đè logic lưu (ví dụ: Mood Check-in)
        await onCustomSave(entryType, entryType === 'thought' ? { ...payload, moodScore: moodLevel } : payload);
        onSuccess();
        return;
      }

      if (hasTypeChanged) {
        // [ATOMIC MIGRATION]: Thực hiện xóa cũ và gọi Service lưu mới trong cùng một phiên
        const oldTable = wasTask ? db.tasks : db.thoughts;
        await db.transaction('rw', db.tasks, db.thoughts, async () => {
          await oldTable.delete(Number(initialData.id));
          // Khi chuyển đổi, ta coi như là một bản ghi mới hoàn toàn để chạy lại Routing
          const { id, ...payloadWithoutId } = payload;
          result = await EntryService.saveEntry(payloadWithoutId, entryType);
        });
      } else {
        // Lưu thông thường qua Tổng kho điều phối
        result = await EntryService.saveEntry(payload, entryType);
      }

      // 3. Phản hồi UI đồng bộ
      if (result && result.success) {
        // Nếu là Thought mới, lưu thêm điểm Mood vào bảng moods
        if (!initialData?.id && entryType === 'thought') {
          await db.moods.add({ 
            score: moodLevel, 
            label: 'entry_reflection', 
            createdAt: Date.now() 
          });
        }

        showNotification(result.message, () => openEditModal(result.record));
        
        if (!initialData) setSearchQuery('', 'mind');
        triggerHaptic('success');
        onSuccess();
      }
    } catch (err) {
      console.error("Critical Save Error in Hook:", err);
    }
  };

  return {
    entryType, setEntryType, content, setContent, targetCount, setTargetCount,
    unit, setUnit, freq, setFreq, isUrgent, setIsUrgent, isImportant, setIsImportant,
    selectedWeekDays, selectedMonthDays, moodLevel, setMoodLevel,
    toggleWeekDay: (d) => setSelectedWeekDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    toggleMonthDay: (d) => setSelectedMonthDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    handleSave, handleContentChange
  };
};