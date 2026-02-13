import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

/**
 * [CORE]: Tầng dữ liệu cơ sở sử dụng Dexie.js
 * Quản lý lưu trữ cục bộ cho các thực thể chính của Mind Cap.
 */
export class MindCapDatabase extends Dexie {
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;

  constructor() {
    super('MindCapDB');

    // Định nghĩa Schema (Chỉ liệt kê các field cần index)
    this.version(2).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount', 
      thoughts: '++id, type, createdAt',
      moods: '++id, score, createdAt',
      userProfile: '++id' 
    });
  }
}

export const db = new MindCapDatabase();

/**
 * Xóa toàn bộ dữ liệu trong trường hợp khẩn cấp (Panic)
 */
export const panicClearDatabase = async () => {
  await db.delete();
  window.location.reload();
};