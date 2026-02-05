import Dexie, { type Table } from 'dexie';
import { getDateString } from './date'; 

export type Priority = 'normal' | 'important' | 'urgent' | 'hỏa-tốc';
export type Mood = 'positive' | 'neutral' | 'negative';
export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

// 1. Định nghĩa cấu trúc Log
export interface LifecycleLog {
  action: 'created' | 'focus_enter' | 'focus_exit_manual' | 'midnight_reset' | 'completed' | 'archived' | 'revived' | 'edited';
  timestamp: number;
}

export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  is_task: boolean;
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  is_focus: boolean;
  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// 2. Interface cho 2 bảng mới (SỬA LỖI BUILD)
export interface PromptConfig {
  id?: number;
  [key: string]: any; 
}

export interface AppState {
  id?: number;
  key: string;
  value: any;
}

export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  
  // ▼▼▼ QUAN TRỌNG: PHẢI CÓ 2 DÒNG NÀY ▼▼▼
  prompt_configs!: Table<PromptConfig>; 
  app_state!: Table<AppState>;
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  constructor() {
    super('MindOS_DB');
    this.version(3).stores({ 
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at',
      // ▼▼▼ VÀ SCHEMA Ở ĐÂY ▼▼▼
      prompt_configs: '++id', 
      app_state: '++id, key'
    });
  }
}

export const db = new MindOSDatabase();

export const addLog = (currentLogs: LifecycleLog[], action: LifecycleLog['action']): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

// Hàm Reset lúc nửa đêm
export const performMidnightReset = async () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  await db.entries
    .where('is_focus').equals(1)
    .modify(entry => {
      entry.is_focus = false;
      entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
    });

  await db.entries
    .where('status').equals('completed')
    .filter(entry => entry.date_str !== todayStr)
    .modify(entry => {
      entry.status = 'archived';
    });

  console.log("Mind OS: Midnight Reset & Logging completed.");
};
