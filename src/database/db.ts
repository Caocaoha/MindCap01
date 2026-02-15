import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

/**
 * [DATABASE]: MindCap Core Database Controller.
 * Quản lý phiên bản và chỉ mục dữ liệu để tối ưu hóa Candidate Pooling cho Widget.
 */
export class MindCapDatabase extends Dexie {
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;

  constructor() {
    super('MindCapDB');

    // Version 3: Hỗ trợ Multi-Layer Answers
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

    // Version 5: Hệ thống Widget Memory (Memory Spark V2.0)
    this.version(5).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      const initializeWidgetData = (record: any) => {
        if (record.interactionScore === undefined) record.interactionScore = 0;
        if (record.echoLinkCount === undefined) record.echoLinkCount = 0;
        if (record.lastInteractedAt === undefined) record.lastInteractedAt = record.createdAt || Date.now();
      };

      trans.table('tasks').toCollection().modify(initializeWidgetData);
      return trans.table('thoughts').toCollection().modify(initializeWidgetData);
    });

    /**
     * [NEW] Version 6: Hỗ trợ Semantic Echo & Hierarchical Linking (V2.1)
     * Thêm chỉ mục 'parentId' để quản lý các liên kết từ Widget Long Press.
     */
    this.version(6).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      /**
       * Đảm bảo các bản ghi cũ có parentId mặc định là null để tránh lỗi tham chiếu.
       */
      const initializeParentData = (record: any) => {
        if (record.parentId === undefined) record.parentId = null;
      };

      trans.table('tasks').toCollection().modify(initializeParentData);
      return trans.table('thoughts').toCollection().modify(initializeParentData);
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