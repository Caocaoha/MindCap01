/**
 * [CORE]: Định nghĩa interface và kiểu dữ liệu cho database (v3.6)
 * Giai đoạn 6.1: Tích hợp thuộc tính liên kết phân cấp (Parent-Child Relationship).
 */

// --- MODULE: INPUT & SABAN & FOCUS (Bảo tồn 100%) ---
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

  // [NEW] Memory Spark Fields (Spaced Repetition)
  nextReviewAt?: number; 
  reviewStage?: number;  
  lastReviewedAt?: number; 

  // [V2.0] Widget Memory Scoring Fields
  echoLinkCount?: number;     
  interactionScore?: number;  
  lastInteractedAt?: number;  

  // [V2.1] Link System Fields
  parentId?: number;          // ID của bản ghi gốc mà bản ghi này liên kết tới
  isLinkMode?: boolean;       // Cờ UI đánh dấu đang trong trạng thái tạo liên kết
}

// --- MODULE: JOURNEY & INPUT (Bảo tồn 100%) ---
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

  // [NEW] Memory Spark Fields (Spaced Repetition)
  nextReviewAt?: number; 
  reviewStage?: number;  
  lastReviewedAt?: number; 

  // [V2.0] Widget Memory Scoring Fields
  echoLinkCount?: number;     
  interactionScore?: number;  
  lastInteractedAt?: number;  

  // [V2.1] Link System Fields
  parentId?: number;          // ID của bản ghi gốc mà bản ghi này liên kết tới
  isLinkMode?: boolean;       // Cờ UI đánh dấu đang trong trạng thái tạo liên kết
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
    answers: Record<number, string[]>; 
    draftAnswer: string;
    cooldownEndsAt: number | null;
    lastAuditAt: number | null; 
    isManifestoUnlocked: boolean;
    lastStatus: 'newbie' | 'paused' | 'cooldown' | 'enlightened';
  };
}