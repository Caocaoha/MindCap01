import Dexie, { type Table } from 'dexie';

// --- HELPERS ---
// Hàm lấy ngày hiện tại (YYYY-MM-DD)
export const getDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TYPES & INTERFACES ---
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
  
  // QUAN TRỌNG: Bắt buộc là Boolean (True/False)
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  
  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// --- DATABASE CLASS ---
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

// Khởi tạo DB singleton
export const db = new MindOSDatabase();

// --- LOGIC HELPERS ---

export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

// Hàm Reset lúc nửa đêm
export const performMidnightReset = async () => {
  const todayStr = getDateString();
  
  // 1. Reset tiêu điểm (Về false)
  await db.entries
    .filter(e => e.is_focus === true)
    .modify(entry => {
      entry.is_focus = false;
      entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
    });

  // 2. Archive việc đã xong từ hôm qua
  await db.entries
    .filter(e => e.status === 'completed' && e.date_str !== todayStr)
    .modify(entry => {
      entry.status = 'archived';
    });

  console.log("Mind OS: Midnight Reset completed.");
};

// --- MOBILE CONNECTION FIX (QUAN TRỌNG CHO ĐIỆN THOẠI) ---
// Tự động reload trang nếu phát hiện iPhone/Android ngắt kết nối Database
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Các mã lỗi thường gặp khi Safari/Chrome mobile ngắt kết nối IDB
    if (event.reason && (
        event.reason.name === 'DatabaseClosedError' ||
        event.reason.message?.includes('closed') ||
        event.reason.name === 'InvalidStateError'
    )) {
      console.error("MindOS: Mất kết nối DB. Đang tự động tải lại...", event.reason);
      // Tải lại trang để tái kết nối
      window.location.reload();
    }
  });
}