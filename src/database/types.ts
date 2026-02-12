// src/database/types.ts

export interface Entry {
    id?: number;
    content: string;
    type: 'task' | 'mood';
    label: string;
    linkedIds: number[];
    createdAt: number;
}

// Định nghĩa kiểu dữ liệu cho Task (Nhiệm vụ)
export interface ITask {
    id?: number; // Auto-increment
    title: string;
    status: 'pending' | 'processing' | 'completed' | 'dismissed'; // Theo Velocity Loop [cite: 13]
    createdAt: Date;
    scheduledFor?: Date; // Dành cho module Saban
    tags?: string[];
    isFocusMode?: boolean; // Dành cho module Focus (Limit 4) [cite: 5]
  }
  
  // Định nghĩa kiểu dữ liệu cho Thought (Suy nghĩ/Nhật ký)
  export interface IThought {
    id?: number;
    content: string;
    type: 'note' | 'idea' | 'journal';
    createdAt: Date;
    linkedTaskIds?: number[]; // Liên kết ngữ nghĩa (Echo Service) [cite: 7]
  }
  
  // Định nghĩa kiểu dữ liệu cho Mood (Cảm xúc/Identity)
  export interface IMood {
    id?: number;
    score: number; // -2 to +2 (Identity Audit) [cite: 15]
    label: string;
    note?: string;
    createdAt: Date;
  }
  
  // Định nghĩa cấu hình User (Archetype & Gamification)
  export interface IUserProfile {
    id?: number; // Thường chỉ có 1 record
    level: number;
    currentXp: number;
    archetype: 'newbie' | 'manager-led' | 'curious-explorer' | 'harmonized'; // [cite: 21]
    eaScore: number; // Chỉ số phân bổ nỗ lực [cite: 19]
    lastAudit: Date;
  }

// src/database/types.ts

// [NEW] Định nghĩa tần suất
export type TaskFrequency = 'ONCE' | 'DAILY' | 'CUSTOM';

export interface ITask {
  id?: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'dismissed';
  createdAt: Date;
  scheduledFor?: Date;
  tags?: string[];
  isFocusMode?: boolean;

  // [NEW] Fields cho Streak System
  frequency?: TaskFrequency;    // Mặc định là ONCE nếu không có
  streakCurrent?: number;       // Số lửa hiện tại
  streakLastDate?: Date;        // Ngày hoàn thành gần nhất
  streakRecoveryCount?: number; // Đếm ngược 0-3 cho Recovery Mode
  streakFrozenVal?: number;     // Giá trị bảo lưu khi gãy chuỗi
}

export interface IThought {
  id?: number;
  content: string;
  type: 'note' | 'idea' | 'journal';
  createdAt: Date;
  linkedTaskIds?: number[];
}

export interface IUserProfile {
  id?: number;
  level: number;
  currentXp: number;
  archetype: 'newbie' | 'manager-led' | 'curious-explorer' | 'harmonized';
  eaScore: number;
  lastAudit: Date;
}