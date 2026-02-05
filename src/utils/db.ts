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

// 5 Cấp độ cảm xúc (Intensity Engine)
export type Mood = 'v-positive' | 'positive' | 'neutral' | 'negative' | 'v-negative'; 

export type EntryStatus = 'active' | 'completed' | 'deleted' | 'archived';

export type Frequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface LifecycleLog {
  action: string;
  timestamp: number;
}

export interface NLPMetadata {
  original_text?: string;
  extracted_qty?: number;
  extracted_unit?: string;
  extracted_freq?: string;
}

// [CẤU TRÚC V6.0] Vùng Ký Ức & Task
export interface Entry {
  id?: number;
  content: string;
  created_at: number;
  date_str: string;
  
  is_task: boolean;    
  is_focus: boolean;   
  
  priority: Priority;
  status: EntryStatus;
  
  mood: Mood;
  mood_score: number;

  quantity: number;
  progress: number;
  unit: string;
  frequency: Frequency;    
  frequency_detail?: string;
  
  nlp_metadata?: NLPMetadata;

  completed_at?: number;
  lifecycle_logs: LifecycleLog[];

  // Quản trị tri thức (V6.0)
  is_bookmarked?: boolean;
  reflection?: string;
  last_accessed?: number;
}

// [MỚI V7.0] Cấu trúc Căn Tính (Identity Core)
export interface IdentityProfile {
  id?: number;
  audit_date: number;         // Ngày Audit (để tính Entropy sau 3 tháng)
  raw_answers: Record<number, string>; // Dữ liệu thô 26 câu
  core_identities: string[];  // 5 Căn tính chủ đạo
  anti_vision: string;        // Cuộc sống ghê sợ
  vision_statement: string;   // Tầm nhìn
  non_negotiables: string;    // Luật chơi (Tuyên ngôn giới hạn)
}

export interface PromptConfig { id?: number; [key: string]: any; }
export interface AppState { id?: number; key: string; value: any; }

// --- DATABASE CLASS ---
export class MindOSDatabase extends Dexie {
  entries!: Table<Entry>;
  prompt_configs!: Table<PromptConfig>; 
  app_state!: Table<AppState>;
  identity_profile!: Table<IdentityProfile>; // Bảng mới V7.0

  constructor() {
    super('MindOS_V5_Clean');
    
    // Version 5: Nâng cấp hỗ trợ Identity Profile
    this.version(5).stores({ 
      entries: '++id, date_str, is_task, priority, mood, mood_score, status, is_focus, frequency, is_bookmarked, created_at',
      prompt_configs: '++id',
      app_state: '++id, key',
      identity_profile: '++id, audit_date'
    });
  }
}

export const db = new MindOSDatabase();

// --- LOGIC HELPERS ---

export const addLog = (currentLogs: LifecycleLog[], action: string): LifecycleLog[] => {
  return [...(currentLogs || []), { action, timestamp: Date.now() }];
};

export const touchEntry = async (id: number) => {
  await db.entries.update(id, { last_accessed: Date.now() });
};

export const getTriggerEchoes = async (content: string, limit = 3) => {
  const keywords = content.toLowerCase().split(' ').filter(w => w.length > 3);
  if (keywords.length === 0) return [];

  const allEntries = await db.entries.toArray();
  
  return allEntries
    .filter(e => e.content !== content && keywords.some(k => e.content.toLowerCase().includes(k)))
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
};

export const performMidnightReset = async () => {
  const today = new Date();
  const todayStr = getDateString();
  const isMonday = today.getDay() === 1;
  const isFirstOfMonth = today.getDate() === 1;

  await db.entries.toCollection().modify(entry => {
    if (entry.is_focus) {
        entry.is_focus = false;
        entry.lifecycle_logs.push({ action: 'daily_focus_reset', timestamp: Date.now() });
    }
    if (isMonday && entry.frequency === 'weekly') {
        entry.progress = 0;
        entry.lifecycle_logs.push({ action: 'weekly_reset', timestamp: Date.now() });
    }
    if (isFirstOfMonth && entry.frequency === 'monthly') {
        entry.progress = 0;
        entry.lifecycle_logs.push({ action: 'monthly_reset', timestamp: Date.now() });
    }
    if (entry.status === 'completed' && entry.date_str !== todayStr) {
        entry.status = 'archived';
    }
  });
  console.log("Mind OS: Midnight Reset completed.");
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
        event.reason.name === 'DatabaseClosedError' ||
        event.reason.message?.includes('closed') ||
        event.reason.name === 'InvalidStateError'
    )) {
      window.location.reload();
    }
  });
}