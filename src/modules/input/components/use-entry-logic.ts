/**
 * Purpose: Quan ly toan bo logic, trang thai va luu tru cho Entry Form (v9.8).
 * Inputs/Outputs: Tra ve trang thai (State) va cac ham xu ly (Handlers) cho UI.
 * Business Rule: 
 * - [CENTRALIZED]: Chuyển toàn bộ logic điều hướng và lập lịch sang EntryService.
 * - [MIGRATION]: Duy trì tính nguyên tử khi chuyển đổi giữa Task/Thought.
 * - [UPDATE 11.1]: Dong bo hoa truong frequency va repeatOn de hien thi Saban Card chinh xac.
 * [FIX]: Sua loi TS2353 (setType -> setEntryType) de khop voi interface EntryLogic.
 */

import { useState, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { useNotificationStore } from '../../../store/notification-store';
import { EntryService } from '../../../services/entry-service';
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
        const taskData = initialData as ITask;
        setEntryType('task');
        setTargetCount(taskData.targetCount || 1);
        setUnit(taskData.unit || '');
        setIsUrgent(taskData.tags?.includes('p:urgent') || false);
        setIsImportant(taskData.tags?.includes('p:important') || false);

        if (taskData.frequency && taskData.frequency !== 'none') {
          const dbFreq = taskData.frequency;
          
          if (dbFreq === 'monthly') {
            setFreq('days-month');
          } else if (dbFreq === 'daily') {
            setFreq('weekly' as any);
            setSelectedWeekDays([2, 3, 4, 5, 6, 7, 8]);
          } else {
            setFreq(dbFreq as any);
          }

          if (taskData.repeatOn) {
            if (dbFreq === 'monthly' || taskData.frequency === 'monthly') {
              setSelectedMonthDays(taskData.repeatOn);
            } else {
              setSelectedWeekDays(taskData.repeatOn);
            }
          }
        } else {
          const fTag = taskData.tags?.find(t => t.startsWith('freq:'));
          if (fTag) setFreq(fTag.split(':')[1] as any);
          setSelectedWeekDays(taskData.tags?.filter(t => t.startsWith('d:')).map(t => parseInt(t.split(':')[1])) || []);
          setSelectedMonthDays(taskData.tags?.filter(t => t.startsWith('m:')).map(t => parseInt(t.split(':')[1])) || []);
        }
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
      if (f.includes('ngay')) { 
        setFreq('weekly' as any); 
        setSelectedWeekDays([2, 3, 4, 5, 6, 7, 8]); 
      }
      else if (f.includes('tuan')) setFreq('weekly' as any);
      else if (f.includes('thang')) setFreq('days-month' as any);
    }
  }, [parsedQuantity, parsedUnit, parsedFrequency, initialData]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!initialData) setSearchQuery(val, 'mind');
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const isNowTask = entryType === 'task';
    const wasTask = initialData && ('status' in initialData || initialData.sourceTable === 'tasks');
    const hasTypeChanged = initialData?.id && ((wasTask && !isNowTask) || (!wasTask && isNowTask));

    try {
      let payload: any;
      if (isNowTask) {
        let dbFrequency: string = freq === 'once' ? 'none' : freq;
        if (freq === 'days-month') dbFrequency = 'monthly';
        if (freq === 'weekly' && selectedWeekDays.length === 7) dbFrequency = 'daily';

        const repeatOn = dbFrequency === 'monthly' ? selectedMonthDays : selectedWeekDays;

        const tags = [
          `freq:${dbFrequency}`, 
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
          frequency: dbFrequency,
          repeatOn: repeatOn,
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

      let result: any;
      if (onCustomSave) {
        await onCustomSave(entryType, entryType === 'thought' ? { ...payload, moodScore: moodLevel } : payload);
        onSuccess();
        return;
      }

      if (hasTypeChanged) {
        const oldTable = wasTask ? db.tasks : db.thoughts;
        await db.transaction('rw', db.tasks, db.thoughts, async () => {
          await oldTable.delete(Number(initialData.id));
          const { id, ...payloadWithoutId } = payload;
          result = await EntryService.saveEntry(payloadWithoutId, entryType);
        });
      } else {
        result = await EntryService.saveEntry(payload, entryType);
      }

      if (result && result.success) {
        if (!initialData?.id && entryType === 'thought') {
          await db.moods.add({ score: moodLevel, label: 'entry_reflection', createdAt: Date.now() });
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
    entryType, 
    setEntryType, // [FIXED]: Su dung dung ten thuoc tinh theo EntryLogic interface
    content, 
    setContent, 
    targetCount, 
    setTargetCount,
    unit, 
    setUnit, 
    freq, 
    setFreq, 
    isUrgent, 
    setIsUrgent, 
    isImportant, 
    setIsImportant,
    selectedWeekDays, 
    selectedMonthDays, 
    moodLevel, 
    setMoodLevel,
    toggleWeekDay: (d) => setSelectedWeekDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    toggleMonthDay: (d) => setSelectedMonthDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    handleSave, 
    handleContentChange
  };
};