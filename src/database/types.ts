// src/database/types.ts

// [MOD_INPUT] & [MOD_SABAN] & [MOD_FOCUS]
export interface ITask {
  id?: number;              // Auto-increment
  title: string;            // Nội dung task
  status: 'pending' | 'processing' | 'done' | 'dismissed';
  createdAt: Date;          // [FIX]: Dùng Date thay vì number
  scheduledFor?: Date;      // [FIX]: Dùng Date
  isFocusMode: boolean;     // Có đang trong chế độ Focus không
  tags?: string[];          // Index Multi-entry (*tags)
}

// [MOD_JOURNEY] & [MOD_INPUT]
export interface IThought {
  id?: number;              // Auto-increment
  content: string;          // Nội dung suy nghĩ/nhật ký
  type: 'thought' | 'journal' | 'idea' | 'note'; // [FIX]: Bổ sung 'note'
  createdAt: Date;          // [FIX]: Dùng Date
  keywords?: string[];      // Hỗ trợ [SVC_ECHO]
}

// [MOD_IDENTITY]
export interface IMood {
  id?: number;              // Auto-increment
  score: number;            // Thang điểm từ -2 đến +2
  note?: string;            // Ghi chú ngắn đi kèm mood
  createdAt: Date;          // [FIX]: Dùng Date
}

// [SVC_CME] - Gamification & User Profile
export interface IUserProfile {
  id?: number;              
  currentLevel: number;
  currentXP: number;
  archetype: string;
  eaScore: number;
  cpiScore: number;
  lastUpdated: Date;        // [FIX]: Dùng Date
}