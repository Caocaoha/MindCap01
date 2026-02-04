import Dexie, { Table } from 'dexie';

// --- 1. ENTRY: Dữ liệu lõi ---
export interface Entry {
  id: string; // UUID
  content: string;
  created_at: number; // Timestamp

  // Quantified Self Metrics
  // Mặc định là 0 nếu không nhập. Logic xử lý default sẽ nằm ở tầng Application (Service) hoặc Class constructor.
  feeling: number; 
  vision: number;
  identity: number;
  
  // Thời gian logic (để query theo lịch, tách biệt với thời gian tạo)
  year: number;
  month: number;
  date_str: string; // Format "YYYY-MM-DD" để query index cực nhanh cho Daily View

  // Task Configuration
  is_task: boolean;
  status: 'active' | 'completed' | 'archived';
  is_focus: boolean;
  
  // Task Details
  eisenhower_matrix?: 'urgent_important' | 'urgent_not_important' | 'not_urgent_important' | 'not_urgent_not_important';
  target_value?: number;
  unit?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  repeat_days?: number[]; // 0 = Sunday
}

// --- 2. PROMPT CONFIG: Kho chứa các bộ câu hỏi ---
// Không còn là Singleton. Mỗi record là một chế độ (Mode).
export interface PromptConfig {
  id: string; // VD: 'default', 'audit', 'morning_routine'
  name: string; // Tên hiển thị, VD: "Ghi chép tự do", "Tự vấn khắc nghiệt"
  content_list: string[]; // Danh sách câu hỏi của chế độ này
}

// --- 3. ACTIVITY LOGS: Lưu vết chuẩn xác hơn ---
export interface ActivityLog {
  id: string;
  created_at: number;
  action_type: 'TASK_DONE' | 'MOVE_TO_FOCUS' | 'ENTRY_CREATED' | 'SYSTEM_RESET';
  entry_id?: string;
  
  // FIX: Thêm snapshot để biết giá trị tại thời điểm log
  value_snapshot?: any; // VD: Lưu trạng thái task trước khi reset, hoặc điểm mood lúc đó
  metadata?: any; 
}

// --- 4. APP STATE: Bảng quản lý trạng thái hệ thống ---
// Đây là nơi lưu "Last Reset Date" và "Current Mode"
export interface AppState {
  key: string; // VD: 'last_midnight_reset', 'current_prompt_mode'
  value: any;  // VD: 1706543000000, 'audit'
}

// --- DATABASE CLASS ---
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry, string>;
  prompt_configs!: Table<PromptConfig, string>; // Đổi tên cho đúng bản chất
  activity_logs!: Table<ActivityLog, string>;
  app_state!: Table<AppState, string>; // Bảng mới

  constructor() {
    super('MindOS_DB');

    this.version(2).stores({
      // Index date_str để load Todo List hôm nay nhanh nhất
      entries: 'id, created_at, date_str, is_task, status, is_focus, frequency', 
      
      prompt_configs: 'id', // id là tên mode (default, audit...)
      
      activity_logs: 'id, created_at, action_type',
      
      app_state: 'key' // Key-Value store đơn giản
    });
  }
}

export const db = new MindOSDatabase();