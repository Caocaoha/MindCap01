/**
 * Purpose: Định nghĩa interface và kiểu dữ liệu cho database (v8.0).
 * Inputs/Outputs: N/A.
 * Business Rule: 
 * - Tích hợp hệ thống đồng bộ Obsidian (syncStatus, metadata).
 * - Hỗ trợ Smart Merge logic dựa trên timestamp updatedAt.
 * - Bảo tồn dữ liệu cũ cho tính năng T-Rail và Memory Spark.
 */

// --- MODULE: INPUT & SABAN & FOCUS ---
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

  // [NEW 8.0]: Obsidian Sync Fields
  syncStatus?: 'pending' | 'ready_to_export' | 'synced';
  title?: string;
  obsidianPath?: string;
  suggestedTags?: string[];

  // Memory Spark & Widget Fields
  nextReviewAt?: number; 
  reviewStage?: number;  
  lastReviewedAt?: number; 
  echoLinkCount?: number;     
  interactionScore?: number;  
  lastInteractedAt?: number;  

  // Link System
  parentId?: number;          
  isLinkMode?: boolean;       

  // Saban Task Chains
  parentGroupId?: number | string;   
  sequenceOrder?: number;            
  archiveStatus?: 'active' | 'archived'; 
  completionLog?: number[];          
}

// --- MODULE: JOURNEY & INPUT ---
export interface IThought {
  id?: number;
  content: string;
  type: 'note' | 'thought' | 'insight';
  archiveStatus?: 'active' | 'archived';
  wordCount: number;
  createdAt: number;
  recordStatus: 'pending' | 'processing' | 'success';
  updatedAt?: number; 
  isBookmarked?: boolean;
  bookmarkReason?: string;

  // [NEW 8.0]: Obsidian Sync Fields
  syncStatus?: 'pending' | 'ready_to_export' | 'synced';
  title?: string;
  obsidianPath?: string;
  suggestedTags?: string[];

  /**
   * [NEW 6.21]: Trường mood (Tùy chọn).
   * Trước đây Mood lưu ở bảng riêng (IMood). Giờ đây IThought có thể chứa mood trực tiếp
   * để phục vụ tính năng T-Rail (vừa viết nhật ký vừa chấm điểm cảm xúc).
   */
  mood?: number; 
  
  /**
   * [NEW 6.21]: Trường tags (Tùy chọn).
   * Phục vụ việc lưu các nhãn được bóc tách từ NLP.
   */
  tags?: string[];

  // Memory Spark & Link System Fields
  nextReviewAt?: number; 
  reviewStage?: number;  
  lastReviewedAt?: number; 
  echoLinkCount?: number;     
  interactionScore?: number;  
  lastInteractedAt?: number;  
  parentId?: number;          
  isLinkMode?: boolean;       
}

// --- MODULE: IDENTITY (Bảng Mood cũ - Vẫn giữ để tương thích dữ liệu cũ) ---
export interface IMood {
  id?: number;
  score: number;
  label: string;
  createdAt: number;
}

// --- SERVICE: CME ---
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