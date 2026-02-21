/**
 * Purpose: Quan ly toan bo logic, trang thai va luu tru cho Entry Form (v9.9).
 * Inputs/Outputs: Tra ve trang thai (State) va cac ham xu ly (Handlers) cho UI.
 * Business Rule: 
 * - [CENTRALIZED]: Chuyển toàn bộ logic điều hướng và lập lịch sang EntryService.
 * - [MIGRATION]: Duy trì tính nguyên tử khi chuyển đổi giữa Task/Thought.
 * - [UPDATE 11.2]: Nâng cấp hệ thống chu kỳ lặp lại: Làm một lần (Default), Hàng ngày, Tuần, Tháng.
 * - [LOGIC]: Tự động lấp đầy repeatOn [2-8] khi chọn chế độ 'daily'.
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
  /**
   * [RULE]: Mac dinh la 'once' (Lam mot lan) theo yeu cau.
   */
  const [freq, setFreq] = useState<FrequencyType>('once');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [moodLevel, setMoodLevel] = useState<number>(3);

  /**
   * [EFFECT]: Khoi tao du lieu khi Edit Task.
   * Chuyen doi tu kieu du lieu DB (none, daily, weekly, monthly) sang UI (once, daily, days-week, days-month).
   */
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
            setSelectedMonthDays(taskData.repeatOn || []);
          } else if (dbFreq === 'daily') {
            setFreq('daily');
          } else if (dbFreq === 'weekly') {
            setFreq('days-week');
            setSelectedWeekDays(taskData.repeatOn || []);
          } else {
            setFreq(dbFreq as any);
          }
        } else {
          // Fallback cho cac task cu dung Tags
          const fTag = taskData.tags?.find(t => t.startsWith('freq:'));
          const fValue = fTag ? fTag.split(':')[1] : 'once';
          
          if (fValue === 'none') setFreq('once');
          else if (fValue === 'monthly') setFreq('days-month');
          else if (fValue === 'weekly') setFreq('days-week');
          else setFreq(fValue as any);

          setSelectedWeekDays(taskData.tags?.filter(t => t.startsWith('d:')).map(t => parseInt(t.split(':')[1])) || []);
          setSelectedMonthDays(taskData.tags?.filter(t => t.startsWith('m:')).map(t => parseInt(t.split(':')[1])) || []);
        }
      } else {
        setEntryType('thought');
      }
    } else if (searchQuery) setContent(searchQuery);
  }, [initialData]);

  /**
   * [EFFECT]: NLP Parsing (Trich xuat thong tin tu ngon ngu tu nhien).
   */
  useEffect(() => {
    if (initialData) return;
    if (parsedQuantity !== null) setTargetCount(parsedQuantity);
    if (parsedUnit !== null) setUnit(parsedUnit);
    if (parsedFrequency) {
      const f = parsedFrequency.toLowerCase();
      if (f.includes('ngay')) { 
        setFreq('daily'); 
      }
      else if (f.includes('tuan')) setFreq('days-week');
      else if (f.includes('thang')) setFreq('days-month');
    }
  }, [parsedQuantity, parsedUnit, parsedFrequency, initialData]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!initialData) setSearchQuery(val, 'mind');
  };

  /**
   * [ACTION]: Luu vao Mind Cap.
   * Xu ly logic mapping tu UI ve chuan luu tru Database.
   */
  const handleSave = async () => {
    if (!content.trim()) return;
    const isNowTask = entryType === 'task';
    const wasTask = initialData && ('status' in initialData || initialData.sourceTable === 'tasks');
    const hasTypeChanged = initialData?.id && ((wasTask && !isNowTask) || (!wasTask && isNowTask));

    try {
      let payload: any;
      if (isNowTask) {
        /**
         * [CORE MAPPING LOGIC]:
         * - 'once' -> DB: 'none', RepeatOn: []
         * - 'daily' -> DB: 'daily', RepeatOn: [2,3,4,5,6,7,8]
         * - 'days-week' -> DB: 'weekly', RepeatOn: selectedWeekDays
         * - 'days-month' -> DB: 'monthly', RepeatOn: selectedMonthDays
         */
        let dbFrequency: string = 'none';
        let repeatOn: number[] = [];

        if (freq === 'daily') {
          dbFrequency = 'daily';
          repeatOn = [2, 3, 4, 5, 6, 7, 8]; // Tu Thu 2 den Chu nhat
        } else if (freq === 'days-week') {
          dbFrequency = 'weekly';
          repeatOn = selectedWeekDays;
        } else if (freq === 'days-month') {
          dbFrequency = 'monthly';
          repeatOn = selectedMonthDays;
        } else {
          dbFrequency = 'none';
          repeatOn = [];
        }

        const tags = [
          `freq:${dbFrequency}`, 
          isUrgent ? 'p:urgent' : '', 
          isImportant ? 'p:important' : '', 
          ...(freq === 'days-week' || freq === 'daily' ? repeatOn.map(d => `d:${d}`) : []), 
          ...(freq === 'days-month' ? repeatOn.map(m => `m:${m}`) : [])
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
    setEntryType, 
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