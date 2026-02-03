import Dexie, { type Table } from 'dexie';

// Định nghĩa cấu trúc một bản ghi (Entry)
export interface Entry {
  id?: string;
  content: string;
  created_at: string;
  
  // Các chỉ số đo lường (Quantified Self)
  feeling: number;
  impact_vision: number;
  impact_identity: number;
  impact_year: number;
  impact_month: number;

  // Cấu hình Task (Việc cần làm)
  is_task: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  is_focus: boolean;       // Có đang là Tiêu điểm không
  urgent: boolean;
  important: boolean;
  target_value: number;    // Ví dụ: Đọc 5 trang
  target_unit: string;     // Đơn vị: Trang, Phút...
  frequency: 'ONCE' | 'DAILY' | 'CUSTOM';
  repeat_days: number[];   // 0=CN, 1=T2, 2=T3...
  
  completed_at?: string;   // Thời gian hoàn thành
  focus_date?: string;     // Ngày đưa vào tiêu điểm
  
  // Logic Streak Gamification (Điểm phong độ)
  streak_current?: number;       // Số chuỗi hiện tại
  streak_last_date?: string;     // Ngày hoàn thành gần nhất (YYYY-MM-DD)
  streak_recovery_count?: number;// Đếm số ngày đang cày lại để hồi phục chuỗi
  streak_frozen_val?: number;    // Lưu số streak cũ trước khi bị gãy
}

// Định nghĩa cấu trúc Log hoạt động
export interface ActivityLog {
  id?: string;
  entry_id: string;
  action_type: 'TASK_DONE' | 'MOVE_TO_FOCUS';
  created_at: string;
  val_vision?: number;
}

// Khởi tạo Database
class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  activity_logs!: Table<ActivityLog>;

  constructor() {
    // Đặt tên DB là V4 để đảm bảo tạo mới sạch sẽ, tránh xung đột dữ liệu cũ
    super('MindOS_DB_V4'); 
    this.version(1).stores({
      entries: 'id, created_at, status, is_focus, frequency, [status+is_task]',
      activity_logs: 'id, entry_id, created_at, action_type'
    });
  }
}

export const db = new MindOSDatabase();