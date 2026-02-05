import Dexie, { type Table } from 'dexie';

// Định nghĩa các kiểu dữ liệu dựa theo Spec v3.1 [cite: 9, 10]
export type Priority = 'normal' | 'important' | 'urgent' | 'hỏa-tốc';
export type Mood = 'positive' | 'neutral' | 'negative';
export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string; // Khóa chính để truy vấn theo ngày
  is_task: boolean;
  priority: Priority;
  mood: Mood;
  status: EntryStatus;
  is_focus: boolean;
  completed_at?: number;
}

export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;

  constructor() {
    super('MindOS_DB');
    
    // Thiết lập Schema 
    // Indexing các trường quan trọng để tìm kiếm nhanh
    this.version(1).stores({
      entries: '++id, date_str, is_task, priority, mood, status, is_focus, created_at'
    });
  }
}

export const db = new MindOSDatabase();

/**
 * CÁC HÀM TIỆN ÍCH DỮ LIỆU CỐT LÕI
 */

// Thăng cấp task lên Tiêu điểm (Focus) với ràng buộc Max 4 [cite: 18, 19]
export const promoteToFocus = async (entryId: number) => {
  const currentFocusCount = await db.entries
    .where({ is_focus: 1, status: 'active' })
    .count();

  if (currentFocusCount >= 4) {
    // Nếu đầy, cập nhật created_at để đẩy lên đầu Kho việc thay vì thêm vào Focus [cite: 19]
    await db.entries.update(entryId, { created_at: Date.now() });
    return { success: false, message: "Danh sách Tiêu điểm đã đầy (4/4)!" };
  }

  await db.entries.update(entryId, { is_focus: true });
  return { success: true };
};

// Midnight Reset: Tự động dọn dẹp mỗi nửa đêm [cite: 24]
export const performMidnightReset = async () => {
  await db.entries
    .where('is_focus')
    .equals(1)
    .modify({ is_focus: false });
  console.log("System: Midnight Reset completed.");
};