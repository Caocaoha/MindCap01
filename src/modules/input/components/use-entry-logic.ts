/**
 * Purpose: Quan ly toan bo logic, trang thai va luu tru cho Entry Form.
 * Inputs/Outputs: Tra ve trang thai (State) va cac ham xu ly (Handlers) cho UI.
 * Business Rule: 
 * - Xu ly logic NLP tu dong, tinh diem tuong tac va kich hoat Waterfall (>16 tu).
 * - Gan mac dinh syncStatus: 'pending' cho tat ca ban ghi moi de phuc vu dong bo Obsidian.
 */

import { useState, useEffect } from 'react';
import { db } from '../../../database/db';
import { triggerHaptic } from '../../../utils/haptic';
import { useUiStore } from '../../../store/ui-store';
import { NotificationManager } from '../../spark/notification-manager';
import { EntryFormProps, EntryType, FrequencyType, EntryLogic } from './entry-types';
import { ITask, IThought } from '../../../database/types';

export const useEntryLogic = (props: EntryFormProps): EntryLogic => {
  const { initialData, onSuccess, onCustomSave } = props;
  const { setSearchQuery, searchQuery, parsedQuantity, parsedUnit, parsedFrequency } = useUiStore();

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
      if ('status' in initialData) {
        setEntryType('task');
        setTargetCount(initialData.targetCount || 1);
        setUnit(initialData.unit || '');
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
    const isNewLinked = initialData?.parentId && !initialData?.id;
    const bonus = isNewLinked ? 10 : 0;
    
    let payload: any;
    if (entryType === 'task') {
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
        interactionScore: (initialData?.interactionScore || 0) + bonus,
        lastInteractedAt: now, 
        archiveStatus: (initialData as ITask)?.archiveStatus || 'active',
        // [NEW]: Dam bao luon co syncStatus cho Obsidian Bridge
        syncStatus: (initialData as ITask)?.syncStatus || 'pending'
      };
    } else {
      payload = { 
        content: content.trim(), 
        type: 'thought', 
        wordCount, 
        createdAt: initialData?.createdAt || now, 
        updatedAt: now, 
        parentId: initialData?.parentId, 
        interactionScore: (initialData?.interactionScore || 0) + bonus,
        // [NEW]: Dam bao luon co syncStatus cho Obsidian Bridge
        syncStatus: (initialData as IThought)?.syncStatus || 'pending'
      };
    }

    if (onCustomSave) {
      await onCustomSave(entryType, entryType === 'thought' ? { ...payload, moodScore: moodLevel } : payload);
    } else {
      const table = entryType === 'task' ? db.tasks : db.thoughts;
      if (initialData?.id) await (table as any).update(initialData.id, payload);
      else {
        const id = await (table as any).add(payload);
        if (entryType === 'thought') await db.moods.add({ score: moodLevel, label: 'entry_reflection', createdAt: now });
        if (wordCount > 16) NotificationManager.scheduleWaterfall(Number(id), entryType, content.trim());
      }
    }
    if (!initialData) setSearchQuery('', 'mind');
    triggerHaptic('success');
    onSuccess();
  };

  return {
    entryType, setEntryType, content, setContent, targetCount, setTargetCount,
    unit, setUnit, freq, setFreq, isUrgent, setIsUrgent, isImportant, setIsImportant,
    selectedWeekDays, selectedMonthDays, moodLevel, setMoodLevel,
    toggleWeekDay: (d) => setSelectedWeekDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    toggleMonthDay: (d) => setSelectedWeekDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]),
    handleSave, handleContentChange
  };
};