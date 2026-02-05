import Dexie, { type Table } from 'dexie';

// Helper lấy ngày
export const getDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Types
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
  is_task: boolean;    
  is_focus: boolean;   
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// === QUAN TRỌNG: ĐỔI TÊN DB ĐỂ NÉ LỖI VERSION CŨ ===
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;

  constructor() {
    // Đổi tên từ 'MindOS_DB' thành tên mới này
    // Điều này ép trình duyệt tạo kho mới tinh, không liên quan kho cũ bị lỗi
    super('MindOS_V5_Clean');
    
    // Reset về version 1 cho kho mới
    this.version(1).stores({ 
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at'
    });
  }
}

export const db = new MindOSDatabase();

// Helpers
export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

export const performMidnightReset = async () => {
  const todayStr = getDateString();
  await db.entries.filter(e => e.is_focus === true).modify(entry => {
    entry.is_focus = false;
    entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
  });
  await db.entries.filter(e => e.status === 'completed' && e.date_str !== todayStr).modify(entry => {
    entry.status = 'archived';
  });
  console.log("Mind OS: Midnight Reset completed.");
};

// Mobile connection fix
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
        event.reason.name === 'DatabaseClosedError' ||
        event.reason.message?.includes('closed') ||
        event.reason.name === 'InvalidStateError'
    )) {
      console.error("MindOS: Reconnecting DB...");
      window.location.reload();
    }
  });
}