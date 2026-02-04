import Dexie, { Table } from 'dexie';

// 1. Định nghĩa lại Interface cho Entry
export interface Entry {
  id: string;
  content: string;
  created_at: number;
  date_str: string;
  type: 'text' | 'image' | 'voice';
  
  is_task?: boolean;
  is_focus?: boolean;
  status?: 'active' | 'completed' | 'deleted' | 'archived';
  
  completed_at?: number; // Trường mới thêm
  
  frequency?: 'once' | 'daily' | 'weekly'; 
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

// 2. Khởi tạo Database
class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  activity_logs!: Table<ActivityLog>;
  prompt_configs!: Table<PromptConfig>;
  app_state!: Table<AppState>;

  constructor() {
    super('MindOS_DB');
    
    // [FIX]: Tăng version lên 30 để ghi đè phiên bản cũ đang kẹt trong máy
    this.version(30).stores({
      entries: 'id, date_str, type, is_task, is_focus, status, created_at, completed_at',
      activity_logs: 'id, created_at, action_type',
      prompt_configs: 'id',
      app_state: 'key'
    });
  }
}

export const db = new MindOSDatabase();