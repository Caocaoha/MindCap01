/**
 * Purpose: Định nghĩa interface và kiểu dữ liệu cho database (v9.2).
 * Inputs/Outputs: N/A.
 * Business Rule: 
 * - Tích hợp hệ thống đồng bộ Obsidian với cơ chế định danh nguồn (sourceTable).
 * - Bổ sung trạng thái 'ignored' để dứt khoát hóa quy trình Review.
 * - Hỗ trợ Smart Merge và bảo tồn tính nhất quán dữ liệu qua Bridge.
 * - [NEW 9.1]: Cố định sourceTable để tránh lỗi lệch ID giữa các bảng.
 * - [NEW 9.2]: Bổ sung ISparkSchedule phục vụ Catch-up Logic để fix lỗi trễ thông báo.
 */

// --- MODULE: SPARK CATCH-UP LOGIC (v9.2) ---
/**
 * [NEW 9.2]: Interface lưu trữ các mốc thời gian Spark để Service Worker quét ngầm.
 * Phục vụ việc hiển thị thông báo ngay lập tức nếu trình duyệt bị "ngủ đông" quá 10 phút.
 */
export interface ISparkSchedule {
  id?: number;              // ID tự tăng
  entryId: number;          // ID của bản ghi (Task/Thought)
  entryType: 'tasks' | 'thoughts'; // Bảng nguồn
  content: string;          // Nội dung để hiển thị 100% Content trên banner
  scheduledAt: number;      // Thời điểm dự kiến hiển thị (Timestamp)
  status: 'pending' | 'sent' | 'missed'; // Trạng thái của mốc thời gian
  createdAt: number;        // Thời điểm tạo lịch
}

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

  // [NEW 9.1]: Obsidian Sync Fields & Traceability
  // Bổ sung 'ignored' để hỗ trợ logic duyệt thẻ nhị phân, ngăn tích tụ hàng chờ.
  syncStatus?: 'pending' | 'ready_to_export' | 'synced' | 'ignored';
  // Định danh bảng nguồn vĩnh viễn để lệnh update không bao giờ trượt mục tiêu.
  sourceTable?: 'tasks' | 'thoughts';
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

  // [NEW 9.1]: Obsidian Sync Fields & Traceability
  // Bổ sung 'ignored' để hỗ trợ logic duyệt thẻ nhị phân.
  syncStatus?: 'pending' | 'ready_to_export' | 'synced' | 'ignored';
  // Định danh bảng nguồn vĩnh viễn phục vụ Atomic Transaction và xử lý Bridge.
  sourceTable?: 'tasks' | 'thoughts';
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