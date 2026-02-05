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

// Mở rộng 5 cấp độ cảm xúc để hỗ trợ Intensity Engine
export type Mood = 'v-positive' | 'positive' | 'neutral' | 'negative' | 'v-negative'; 

export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

// Các loại tần suất lặp lại hỗ trợ quản trị mục tiêu
export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface LifecycleLog {
  action: string;
  timestamp: number;
}

// Metadata ẩn chứa thông tin NLP bóc tách được từ ngôn ngữ tự nhiên
export interface NLPMetadata {
  original_text?: string;
  extracted_qty?: number;
  extracted_unit?: string;
  extracted_freq?: string;
}

// INTERFACE CHÍNH - Cấu trúc dữ liệu Sa bàn Chiến trận
export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  status: EntryStatus;
  
  // NHÓM CẢM XÚC (5 LEVELS)
  mood: Mood;
  mood_score: number; // Mapping: -2, -1, 0, 1, 2

  // NHÓM ĐỊNH LƯỢNG & TIẾN ĐỘ (Dopamine Tracking)
  quantity: number;        // Mục tiêu định lượng (Mặc định: 1)
  progress: number;        // Đã thực hiện (Mặc định: 0)
  unit: string;            // Đơn vị đo lường (Mặc định: 'lần')
  frequency: Frequency;    
  frequency_detail?: string; // Chi tiết lịch cụ thể: 'T2, T4, T6' hoặc 'Ngày 10'
  
  nlp_metadata?: NLPMetadata;

  completed_at?: number;
  lifecycle_logs: LifecycleLog[];
}

export interface PromptConfig { id?: number; [key: string]: any; }
export interface AppState { id?: number; key: string; value: any; }

// --- DATABASE CLASS ---
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  prompt_configs!: Table<PromptConfig>; 
  app_state!: Table<AppState>;

  constructor() {
    super('MindOS_V5_Clean');
    
    // Version 3: Schema hỗ trợ NLP, Mood 5 cấp độ và Progress Tracking
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

/**
 * Hàm tìm kiếm "Tiếng vang" (Echoes)
 * Tìm các ghi chú hoặc cảm xúc cũ có chứa từ khóa liên quan đến Task để nhắc nhở động lực
 */
export const getTriggerEchoes = async (content: string, limit = 3) => {
  const keywords = content.toLowerCase().split(' ').filter(w => w.length > 3);
  if (keywords.length === 0) return [];

  const allEntries = await db.entries.filter(e => !e.is_task).toArray();
  
  return allEntries
    .filter(e => keywords.some(k => e.content.toLowerCase().includes(k)))
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
};

/**
 * Hàm Reset theo Chu kỳ (Hồi sinh - Reset Logic)
 * Tự động hóa việc đặt lại tiến độ thói quen vào các mốc thời gian cụ thể
 */
export const performMidnightReset = async () => {
  const today = new Date();
  const todayStr = getDateString();
  
  // Xác định các mốc thời gian để hồi sinh Task
  const isMonday = today.getDay() === 1; // 0h sáng thứ Hai
  const isFirstOfMonth = today.getDate() === 1; // Ngày 1 hàng tháng

  await db.entries.toCollection().modify(entry => {
    // 1. Reset Tiêu điểm hàng ngày (Daily Focus Reset)
    if (entry.is_focus) {
        entry.is_focus = false;
        entry.lifecycle_logs.push({ action: 'daily_focus_reset', timestamp: Date.now() });
    }

    // 2. Reset Tiến độ Weekly (Hồi sinh vào sáng Thứ Hai)
    if (isMonday && entry.frequency === 'weekly') {
        entry.progress = 0;
        entry.lifecycle_logs.push({ action: 'weekly_progress_reset', timestamp: Date.now() });
    }

    // 3. Reset Tiến độ Monthly (Hồi sinh vào ngày 1 hàng tháng)
    if (isFirstOfMonth && entry.frequency === 'monthly') {
        entry.progress = 0;
        entry.lifecycle_logs.push({ action: 'monthly_progress_reset', timestamp: Date.now() });
    }

    // 4. Lưu trữ việc đã xong ngày cũ vào Kho lưu trữ (Archiving)
    if (entry.status === 'completed' && entry.date_str !== todayStr) {
        entry.status = 'archived';
    }
  });

  console.log("Mind OS: Midnight Reset logic executed.");
};

// Fix lỗi mất kết nối trên Mobile và xử lý DatabaseClosedError
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
        event.reason.name === 'DatabaseClosedError' ||
        event.reason.message?.includes('closed') ||
        event.reason.name === 'InvalidStateError'
    )) {
      console.warn("MindOS: Mất kết nối DB. Đang tự động tải lại...", event.reason);
      window.location.reload();
    }
  });
}