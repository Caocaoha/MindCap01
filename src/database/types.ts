/**
 * Purpose: Định nghĩa interface và kiểu dữ liệu cho database (v11.0).
 * Business Rule: 
 * - Tích hợp hệ thống đồng bộ Obsidian với cơ chế định danh nguồn (sourceTable).
 * - Bổ sung trạng thái 'ignored' để dứt khoát hóa quy trình Review.
 * - [NEW 9.2]: Bổ sung ISparkSchedule phục vụ Catch-up Logic để fix lỗi trễ thông báo.
 * - [NEW 11.0]: Bổ sung cấu hình Forgiveness Hour (Giờ tha thứ) để giải phóng tâm lý.
 * - [NEW 11.1]: Bổ sung repeatOn cho ITask để hỗ trợ hiển thị tần suất lặp lại tùy chỉnh.
 * - [UPDATE 11.2]: Mở rộng forgivenessHour hỗ trợ kiểu string (HH:mm) để đặt giờ lẻ.
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
  /**
   * [NEW 11.1]: Danh sách các ngày lặp lại (Ví dụ: [1, 3, 5] cho T2, T4, T6).
   * Phục vụ việc hiển thị tần suất lặp lại trên thanh biểu hiện task.
   */
  repeatOn?: number[];
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
  
  /**
   * [UPDATE]: Bổ sung isFocusMode dưới dạng tùy chọn (?) để tránh lỗi ở các file khác.
   * Phục vụ Forgiveness Engine trong việc giải phóng tâm lý.
   */
  isFocusMode?: boolean; 

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

  /**
   * [NEW 11.0]: Forgiveness Hour Configuration
   * Quản lý mốc thời gian giải phóng gánh nặng tâm lý.
   * [UPDATE]: Hỗ trợ cả kiểu number (0-23) và string ("HH:mm").
   */
  forgivenessHour?: number | string;    
  
  /**
   * [UPDATE 11.3]: Time-Stamp Locking
   * Thay vì chỉ lưu Ngày (YYYY-MM-DD), giờ đây lưu kết hợp Ngày_Giờ (Ví dụ: "2026-02-20_19:30").
   * Giúp hệ thống chống spam nhưng vẫn cho phép test lại trong ngày nếu đổi mốc giờ.
   */
  lastForgivenessRun?: string; 

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