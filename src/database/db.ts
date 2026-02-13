import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

export class MindCapDatabase extends Dexie {
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;

  constructor() {
    super('MindCapDB');

    // Nâng cấp lên Version 3 để hỗ trợ Multi-Layer Answers
    this.version(3).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount', 
      thoughts: '++id, type, createdAt',
      moods: '++id, score, createdAt',
      userProfile: '++id' 
    });
  }
}

export const db = new MindCapDatabase();

export const panicClearDatabase = async () => {
  await db.delete();
  window.location.reload();
};