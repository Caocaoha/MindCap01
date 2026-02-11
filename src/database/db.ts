// src/database/db.ts
import Dexie, { type Table } from 'dexie';
import { Task, Thought, UserState } from './types';

export class MindCapDatabase extends Dexie {
  tasks!: Table<Task>;
  thoughts!: Table<Thought>;
  userState!: Table<UserState>;

  constructor() {
    super('MindCapDB');
    // Bump version 6
    this.version(6).stores({
      // Thêm index cho nextReviewAt để query nhanh
      tasks: 'id, type, status, priority, createdAt, tags, *linkedIds, parentId, isRecurring, streak_last_date, nextReviewAt', 
      thoughts: 'id, type, moodValue, createdAt, opacity, isBookmarked, tags, *linkedIds, parentId, nextReviewAt',
      userState: '++id'
    });
  }
}
export const db = new MindCapDatabase();