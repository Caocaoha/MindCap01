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
  // 2. Thêm trường lưu vết vòng đời
  lifecycle_logs: LifecycleLog[];
}

export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;

  constructor() {
    super('MindOS_DB');
    this.version(2).stores({ // Nâng version lên 2 do thay đổi cấu trúc
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at'
    });
  }
}

export const db = new MindOSDatabase();

// 3. Hàm tiện ích để tạo nhanh mảng log mới
export const addLog = (currentLogs: LifecycleLog[], action: LifecycleLog['action']): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

// 4. Cập nhật Logic Reset nửa đêm có Ghi log
export const performMidnightReset = async () => {
  const todayStr = getDateString();

  // Reset Tiêu điểm: Ghi log 'midnight_reset' và đẩy ra khỏi Focus
  await db.entries
    .where('is_focus').equals(1)
    .modify(entry => {
      entry.is_focus = false;
      entry.lifecycle_logs.push({ action: 'midnight_reset', timestamp: Date.now() });
    });

  // Lưu trữ việc đã xong hôm qua: Chuyển status sang archived (hoặc giữ completed nhưng ẩn đi tùy logic hiển thị)
  // Theo logic đã chốt: Việc đã xong qua ngày sẽ thành 'archived' để ẩn khỏi Todo
  await db.entries
    .where('status').equals('completed')
    .filter(entry => entry.date_str !== todayStr)
    .modify(entry => {
      entry.status = 'archived';
      // Không cần log thêm vì trạng thái completed cũ đã đủ nghĩa, 
      // nhưng nếu muốn chặt chẽ có thể log 'system_archive'
    });

  console.log("Mind OS: Midnight Reset & Logging completed.");
};