import Dexie, { type Table } from 'dexie';

// Helper lấy ngày hiện tại (YYYY-MM-DD)
export const getDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Định nghĩa các kiểu dữ liệu (Types)
export type Priority = 'normal' | 'important' | 'urgent' | 'hỏa-tốc';
export type Mood = 'positive' | 'neutral' | 'negative';
export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

export interface LifecycleLog {
  action: string;
  timestamp: number;
}

// Interface chính cho bản ghi (Entry)
export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  
  // BẮT BUỘC LÀ BOOLEAN (True/False)
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  
  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// Class Database
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;

  constructor() {
    super('MindOS_DB');
    
    // Version 4: Giữ nguyên cấu trúc Index
    this.version(4).stores({ 
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at'
    });
  }
}

// Khởi tạo DB
export const db = new MindOSDatabase();

// Helper ghi log
export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

// Hàm Reset lúc nửa đêm (Optional - để dùng sau này)
export const performMidnightReset = async () => {
  const todayStr = getDateString();
  
  // Reset tiêu điểm
  await db.entries
    .filter(e => e.is_focus === true)
    .modify(entry => {
      entry.is_focus = false;
      entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
    });

  // Archive việc đã xong từ hôm qua
  await db.entries
    .filter(e => e.status === 'completed' && e.date_str !== todayStr)
    .modify(entry => {
      entry.status = 'archived';
    });

  console.log("Mind OS: Midnight Reset completed.");
};