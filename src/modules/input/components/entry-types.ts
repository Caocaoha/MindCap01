/**
 * Purpose: Dinh nghia interface va kieu du lieu dung chung cho Entry Form.
 * Inputs/Outputs: Khai bao cac kieu du lieu (Props, Payload).
 * Business Rule: Ho tro dong nhat ca hai che do Task (Nhiem vu) va Thought (Suy nghi).
 */

import { ITask, IThought } from '../../../database/types';

export type EntryType = 'task' | 'thought';
export type FrequencyType = 'once' | 'weekly' | 'days-week' | 'days-month';

export interface EntryFormProps {
  initialData?: ITask | IThought | null;
  onSuccess: () => void;
  onCancel: () => void;
  onCustomSave?: (type: EntryType, data: any) => Promise<void>;
}

export interface EntryLogic {
  entryType: EntryType;
  setEntryType: (t: EntryType) => void;
  content: string;
  setContent: (val: string) => void;
  targetCount: number;
  setTargetCount: (n: number) => void;
  unit: string;
  setUnit: (s: string) => void;
  freq: FrequencyType;
  setFreq: (f: FrequencyType) => void;
  isUrgent: boolean;
  setIsUrgent: (b: boolean) => void;
  isImportant: boolean;
  setIsImportant: (b: boolean) => void;
  selectedWeekDays: number[];
  selectedMonthDays: number[];
  moodLevel: number;
  setMoodLevel: (n: number) => void;
  toggleWeekDay: (d: number) => void;
  toggleMonthDay: (d: number) => void;
  handleSave: () => Promise<void>;
  handleContentChange: (val: string) => void;
}