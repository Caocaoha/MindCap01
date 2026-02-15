import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

export class MindCapDatabase extends Dexie {
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;

  constructor() {
    super('MindCapDB');

    // Version 3: Hỗ trợ Multi-Layer Answers (Giữ nguyên lịch sử)
    this.version(3).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount', 
      thoughts: '++id, type, createdAt',
      moods: '++id, score, createdAt',
      userProfile: '++id' 
    });

    // [NEW] Version 4: Tích hợp Memory Spark (Spaced Repetition)
    // Thêm index 'nextReviewAt' để hỗ trợ truy vấn hiệu suất cao cho Background Worker
    this.version(4).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt', 
      thoughts: '++id, type, createdAt, nextReviewAt',
      moods: '++id, score, createdAt', // Giữ nguyên
      userProfile: '++id' // Giữ nguyên
    }).upgrade(trans => {
      // Migration logic (nếu cần thiết trong tương lai)
      // Hiện tại dữ liệu cũ sẽ có nextReviewAt = undefined (không được index)
      return trans.table('tasks').toCollection().modify(task => {
        if (!task.reviewStage) task.reviewStage = 0;
      });
    });
  }
}

export const db = new MindCapDatabase();

export const panicClearDatabase = async () => {
  await db.delete();
  window.location.reload();
};