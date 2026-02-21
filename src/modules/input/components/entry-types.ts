/**
 * Purpose: Dinh nghia interface va kieu du lieu dung chung cho Entry Form (v11.2).
 * Inputs/Outputs: Khai bao cac kieu du lieu (Props, Payload).
 * Business Rule: 
 * - Ho tro dong nhat ca hai che do Task (Nhiem vu) va Thought (Suy nghi).
 * - [UPDATE 11.2]: Cap nhat FrequencyType ho tro logic moi: Once, Daily, Days-Week, Days-Month.
 * - [FIX]: Loai bo cac kieu du lieu du thua de toi uu hoa bo loc UI.
 */

import { ITask, IThought } from '../../../database/types';

export type EntryType = 'task' | 'thought';

/**
 * [CENTRALIZED TYPE]: Dinh nghia cac chu ky lap lai hien thi tren UI.
 * - once: Lam mot lan (Mac dinh).
 * - daily: Lap lai moi ngay.
 * - days-week: Tuy chon cac ngay trong tuan (2-8).
 * - days-month: Tuy chon cac ngay trong thang (1-31).
 */
export type FrequencyType = 'once' | 'daily' | 'days-week' | 'days-month';

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