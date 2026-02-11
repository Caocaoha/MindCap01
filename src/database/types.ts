// src/database/types.ts

export type Priority = 'critical' | 'urgent' | 'important' | 'normal';
export type TaskStatus = 'todo' | 'active' | 'completed';
export type Archetype = 'NEWBIE' | 'MANAGER' | 'ARCHITECT' | 'EXPLORER';

export interface BaseEntity {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  linkedIds?: string[];
  // --- Spaced Repetition (Spark) ---
  wordCount?: number;
  reviewCount?: number;
  nextReviewAt?: number | null;
  // --- Journey ---
  isBookmarked?: boolean;
  bookmarkReason?: string;
}

export interface Task extends BaseEntity {
  type: 'task';
  status: TaskStatus; // Đảm bảo đồng nhất kiểu dữ liệu
  priority: Priority;
  identityScore?: number;
  progress?: number;
  quantity?: number;
  unit?: string;
  completedAt?: number;
  isRecurring?: boolean;
  streak_current?: number;
  streak_last_date?: string;
  streak_recovery_count?: number;
  streak_frozen_val?: number;
}

export interface Thought extends BaseEntity {
  type: 'thought';
  moodValue?: number;
  opacity?: number;
}

export interface UserState {
  id?: number;
  level: number;
  currentCME: number;
  archetype: Archetype; // Thống nhất kiểu Archetype thay vì string
  identity: {
    isCompleted: boolean;
    lastAuditAt?: number;
    responses?: Record<string, string>;
  };
}