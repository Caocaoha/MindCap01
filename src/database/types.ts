/**
 * [CORE]: Định nghĩa interface và kiểu dữ liệu cho database (v3.4)
 * Giai đoạn 5: Tích hợp Spaced Repetition (Memory Spark)
 */

// --- MODULE: INPUT & SABAN & FOCUS (Giữ nguyên 100%) ---
export interface ITask {
  id?: number;
  content: string;
  status: 'todo' | 'done' | 'backlog'; 
  frequency?: string;       
  streakCurrent?: number;   
  streakRecoveryCount?: number; 
  createdAt: number;
  updatedAt?: number;
  isFocusMode: boolean; 
  scheduledFor?: number; 
  tags?: string[]; 
  isBookmarked?: boolean;
  bookmarkReason?: string;
  targetCount?: number;
  doneCount?: number;
  unit?: string;

  // [NEW] Memory Spark Fields
  nextReviewAt?: number; // Thời điểm cần ôn tập tiếp theo (Timestamp)
  reviewStage?: number;  // Cấp độ hiện tại (0-5)
  lastReviewedAt?: number; // Thời điểm ôn tập gần nhất
}

// --- MODULE: JOURNEY & INPUT (Giữ nguyên 100%) ---
export interface IThought {
  id?: number;
  content: string;
  type: 'note' | 'thought' | 'insight';
  wordCount: number;
  createdAt: number;
  recordStatus: 'pending' | 'processing' | 'success';
  updatedAt?: number; 
  isBookmarked?: boolean;
  bookmarkReason?: string;

  // [NEW] Memory Spark Fields
  nextReviewAt?: number; // Thời điểm cần ôn tập tiếp theo (Timestamp)
  reviewStage?: number;  // Cấp độ hiện tại (0-5)
  lastReviewedAt?: number; // Thời điểm ôn tập gần nhất
}

// --- MODULE: IDENTITY (Giữ nguyên 100%) ---
export interface IMood {
  id?: number;
  score: number;
  label: string;
  createdAt: number;
}

// --- SERVICE: CME (Nâng cấp identityProgress) ---
export interface IUserProfile {
  id?: number;
  totalScore: number;
  currentLevel: number;
  eaScore: number;
  cpiScore: number;
  archetype: 'newbie' | 'manager-led' | 'curious-explorer' | 'harmonized';
  lastReset: number;
  identityProgress: {
    currentQuestionIndex: number;
    // BỔ SUNG: Chuyển từ string sang string[] để lưu lịch sử trả lời
    answers: Record<number, string[]>; 
    draftAnswer: string;
    cooldownEndsAt: number | null;
    // BỔ SUNG: Lưu mốc thời gian cuối cùng tương tác để tính Bio-Pulse
    lastAuditAt: number | null; 
    isManifestoUnlocked: boolean;
    lastStatus: 'newbie' | 'paused' | 'cooldown' | 'enlightened';
  };
}