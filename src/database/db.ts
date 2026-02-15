import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

/**
 * [DATABASE]: MindCap Core Database Controller.
 * Quản lý phiên bản và chỉ mục dữ liệu để tối ưu hóa Candidate Pooling cho Widget. [cite: 10]
 */
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

    // Version 4: Tích hợp Memory Spark (Spaced Repetition)
    this.version(4).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt', 
      thoughts: '++id, type, createdAt, nextReviewAt',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      return trans.table('tasks').toCollection().modify(task => {
        if (!task.reviewStage) task.reviewStage = 0;
      });
    });

    /**
     * [NEW] Version 5: Hệ thống Widget Memory (Memory Spark V2.0)
     * Thêm index cho 'interactionScore' và 'echoLinkCount' để phục vụ lọc Pool nhanh. 
     */
    this.version(5).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      /**
       * MIGRATION LOGIC: Khởi tạo giá trị mặc định cho các bản ghi cũ.
       * Điều này đảm bảo các bản ghi Heritage (Pool 1) không bị lỗi khi thiếu chỉ số. [cite: 12]
       */
      const initializeWidgetData = (record: any) => {
        if (record.interactionScore === undefined) record.interactionScore = 0;
        if (record.echoLinkCount === undefined) record.echoLinkCount = 0;
        if (record.lastInteractedAt === undefined) record.lastInteractedAt = record.createdAt || Date.now();
      };

      trans.table('tasks').toCollection().modify(initializeWidgetData);
      return trans.table('thoughts').toCollection().modify(initializeWidgetData);
    });
  }
}

export const db = new MindCapDatabase();

/**
 * Lệnh xóa khẩn cấp (Panic Clear).
 */
export const panicClearDatabase = async () => {
  await db.delete();
  window.location.reload();
};