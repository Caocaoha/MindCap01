import Dexie, { Table } from 'dexie';

/**
 * 1. ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU (INTERFACES)
 */

export interface Entry {
  id: string;
  content: string;
  created_at: number;
  date_str: string;        // Định dạng 'YYYY-MM-DD'
  type: 'text' | 'image' | 'voice';
  
  // Logic công việc
  is_task?: boolean;       
  is_focus?: boolean;      // Xác định việc đang nằm trong Tâm trí
  status?: 'active' | 'completed' | 'deleted' | 'archived'; 
  
  // Thời điểm hoàn thành
  completed_at?: number;   
  
  /**
   * Phân loại từ Đường ray chữ L:
   * - normal: Lưu thường
   * - important: Quan trọng
   * - urgent: Gấp
   * - hỏa-tốc: Quan trọng + Khẩn cấp
   */
  priority?: 'normal' | 'important' | 'urgent' | 'hỏa-tốc'; 
  
  /**
   * Phân loại Cảm xúc từ nút Lưu:
   * - positive: Vui (Kéo lên)
   * - negative: Buồn (Kéo xuống)
   * - neutral: Bình thường (Thả tại chỗ)
   */
  mood?: 'positive' | 'negative' | 'neutral'; 
}

export interface ActivityLog {
  id: string;
  created_at: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TASK_DONE' | 'MOVE_TO_FOCUS';
  entry_id?: string;
  details?: any;
}

export interface PromptConfig {
  id: string;
  name: string;
  content_list: string[];
}

export interface AppState {
  key: string;
  value: any;
}

/**
 * 2. KHỞI TẠO CƠ SỞ DỮ LIỆU
 */

class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  activity_logs!: Table<ActivityLog>;
  prompt_configs!: Table<PromptConfig>;
  app_state!: Table<AppState>;

  constructor() {
    super('MindOS_DB');
    
    /**
     * Cấu hình Schema
     * Version 33: Cập nhật thêm trường priority và mood.
     */
    this.version(33).stores({
      entries: 'id, date_str, type, is_task, is_focus, status, created_at, completed_at, priority, mood',
      activity_logs: 'id, created_at, action_type',
      prompt_configs: 'id',
      app_state: 'key'
    });
  }
}

export const db = new MindOSDatabase();