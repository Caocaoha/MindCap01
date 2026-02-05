import Dexie, { type Table } from 'dexie';

// --- HELPERS ---
export const getDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TYPES & INTERFACES (CORE) ---
export type Priority = 'normal' | 'important' | 'urgent' | 'hỏa-tốc';
export type Mood = 'positive' | 'neutral' | 'negative';
export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

export interface LifecycleLog {
  action: string;
  timestamp: number;
}

export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  
  // Boolean chuẩn
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  
  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// --- CÁC INTERFACE PHỤ (THÊM LẠI ĐỂ KHÔNG BỊ LỖI BUILD) ---
export interface PromptConfig {
  id?: number;
  [key: string]: any; 
}

export interface AppState {
  id?: number;
  key: string;
  value: any;
}

// --- DATABASE CLASS ---
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  // Thêm lại các bảng phụ
  prompt_configs!: Table<PromptConfig>; 
  app_state!: Table<AppState>;

  constructor() {
    super('MindOS_V5_Clean');
    
    // Version 1: Định nghĩa đầy đủ các bảng
    this.version(1).stores({ 
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at',
      prompt_configs: '++id', // Thêm lại
      app_state: '++id, key'  // Thêm lại
    });
  }
}

// Khởi tạo DB
export const db = new MindOSDatabase();

// --- LOGIC HELPERS ---
export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

export const performMidnightReset = async () => {
  const todayStr = getDateString();
  
  await db.entries
    .filter(e => e.is_focus === true)
    .modify(entry => {
      entry.is_focus = false;
      entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
    });

  await db.entries
    .filter(e => e.status === 'completed' && e.date_str !== todayStr)
    .modify(entry => {
      entry.status = 'archived';
    });

  console.log("Mind OS: Midnight Reset completed.");
};

// --- MOBILE CONNECTION FIX ---
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
        event.reason.name === 'DatabaseClosedError' ||
        event.reason.message?.includes('closed') ||
        event.reason.name === 'InvalidStateError'
    )) {
      console.error("MindOS: Mất kết nối DB. Đang tự động tải lại...", event.reason);
      window.location.reload();
    }
  });
}