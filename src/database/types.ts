/**
 * [CORE]: Định nghĩa interface và kiểu dữ liệu (Schema Types) cho database
 */
/**
 * [CORE]: Định nghĩa interface và kiểu dữ liệu (Schema Types) cho database
 */

// --- MODULE: INPUT & SABAN & FOCUS ---
export interface ITask {
  id?: number;
  content: string;
  status: 'todo' | 'done' | 'backlog'; 
  createdAt: number;
  updatedAt?: number;
  isFocusMode: boolean; 
  scheduledFor?: number; 
  tags?: string[]; 
  // Bổ sung cho Journey
  isBookmarked?: boolean;
  bookmarkReason?: string;
}

// --- MODULE: JOURNEY & INPUT ---
export interface IThought {
  id?: number;
  content: string;
  type: 'note' | 'thought' | 'insight';
  wordCount: number;
  createdAt: number;
  recordStatus: 'pending' | 'processing' | 'success';
  // Bổ sung cho Journey & Entropy
  updatedAt?: number; 
  isBookmarked?: boolean;
  bookmarkReason?: string;
}

// ... các interface IMood và IUserProfile giữ nguyên 100% như bạn đã gửi

// --- MODULE: IDENTITY ---
export interface IMood {
  id?: number;
  score: number;
  label: string;
  createdAt: number;
}

// --- SERVICE: CME (GAMIFICATION) ---
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
    answers: Record<number, string>;
    draftAnswer: string;
    cooldownEndsAt: number | null;
    isManifestoUnlocked: boolean;
    lastStatus: 'newbie' | 'paused' | 'cooldown' | 'enlightened';
  };
}