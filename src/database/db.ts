// src/database/db.ts
import Dexie, { type Table } from 'dexie';
import { Entry } from './types';
import type { ITask, IThought, IMood, IUserProfile } from './types';

// [CORE]: Tầng dữ liệu cơ sở sử dụng Dexie.js 
export class MindCapDatabase extends Dexie {
  // Khai báo các bảng dữ liệu tương ứng với các module
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;

  constructor() {
    super('MindCapDB'); // Tên database

    // Định nghĩa Schema (Lưu ý: Chỉ liệt kê các field cần đánh index để query)
    this.version(1).stores({
      // Module Input & Focus & Saban
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags', 
      entries: '++id, createdAt, type, label',
      
      // Module Journey & Input
      thoughts: '++id, type, createdAt',
      
      // Module Identity
      moods: '++id, score, createdAt',
      
      // Service CME (Gamification)
      userProfile: '++id' 
    });
  }
}

// Khởi tạo instance database
export const db = new MindCapDatabase();

// Helper: Hàm hỗ trợ Panic Button (Xóa khẩn cấp) [cite: 6, 23]
export const panicClearDatabase = async () => {
  await db.delete();
  window.location.reload();
};