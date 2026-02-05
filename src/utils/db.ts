import Dexie, { type Table } from 'dexie';

// --- HELPERS ---
export const getDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TYPES & INTERFACES ---
export type Priority = 'normal' | 'important' | 'urgent' | 'hỏa-tốc';
export type Mood = 'v-positive' | 'positive' | 'neutral' | 'negative' | 'v-negative'; // 5 Levels
export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';
export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface LifecycleLog {
  action: string;
  timestamp: number;
}

// Metadata ẩn chứa thông tin NLP
export interface NLPMetadata {
  original_text?: string;
  extracted_qty?: number;
  extracted_unit?: string;
  extracted_freq?: string;
}

// INTERFACE CHÍNH
export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  status: EntryStatus;
  
  // --- NHÓM CẢM XÚC (5 LEVELS) ---
  mood: Mood;
  mood_score: number; // -2 đến +2

  // --- NHÓM ĐỊNH LƯỢNG & TIẾN ĐỘ ---
  quantity: number;        // Mục tiêu (Ví dụ: 5)
  progress: number;        // Đã làm (Ví dụ: 3)
  unit: string;            // Đơn vị (km)
  frequency: Frequency;    
  frequency_detail?: string;
  
  nlp_metadata?: NLPMetadata;

  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

// Các bảng phụ (Giữ nguyên để tránh lỗi Build)
export interface PromptConfig { id?: number; [key: string]: any; }
export interface AppState { id?: number; key: string; value: any; }

// --- DATABASE CLASS ---
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  prompt_configs!: Table<PromptConfig>; 
  app_state!: Table<AppState>;

  constructor() {
    super('MindOS_V5_Clean');
    // Version 3: Cập nhật Schema mới nhất
    this.version(3).stores({ 
      entries: '++id, date_str, is_task, priority, mood, mood_score, status, is_focus, frequency, created_at',
      prompt_configs: '++id',
      app_state: '++id, key'
    });
  }
}

export const db = new MindOSDatabase();

// --- LOGIC HELPERS ---
export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

// Fix mất kết nối Mobile
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (event.reason.name === 'DatabaseClosedError' || event.reason.message?.includes('closed'))) {
      window.location.reload();
    }
  });
}