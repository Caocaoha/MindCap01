import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile } from './types';

/**
 * Purpose: MindCap Core Database Controller - Quản lý lưu trữ IndexedDB bằng Dexie.js (v9.0).
 * Inputs/Outputs: Khởi tạo database, thực hiện migration dữ liệu.
 * Business Rule: 
 * - Quản lý phiên bản và lược đồ lưu trữ đồng bộ.
 * - [NEW 9.0]: Tích hợp chỉ mục sourceTable để định danh tuyệt đối nguồn dữ liệu.
 * - Đảm bảo tính nhất quán dữ liệu qua cơ chế Atomic Migration.
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

    // Version 6: Hỗ trợ Semantic Echo & Hierarchical Linking (V2.1)
    this.version(6).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      const initializeParentData = (record: any) => {
        if (record.parentId === undefined) record.parentId = null;
      };

      trans.table('tasks').toCollection().modify(initializeParentData);
      return trans.table('thoughts').toCollection().modify(initializeParentData);
    });

    /**
     * [NEW] Version 7: Tích hợp Mod-Saban v4.1 (Task Chains & Archive)
     */
    this.version(7).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      return trans.table('tasks').toCollection().modify(task => {
        if (task.parentGroupId === undefined) task.parentGroupId = null;
        if (task.sequenceOrder === undefined) task.sequenceOrder = 0;
        if (task.archiveStatus === undefined) task.archiveStatus = 'active';
        if (task.completionLog === undefined) task.completionLog = [];
      });
    });

    /**
     * [NEW 8.0] Version 8: Tích hợp Obsidian Sync System (Phase 1)
     */
    this.version(8).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      const initializeSyncData = (record: any) => {
        if (record.syncStatus === undefined) record.syncStatus = 'pending';
        if (record.title === undefined) record.title = '';
        if (record.obsidianPath === undefined) record.obsidianPath = '';
        if (record.suggestedTags === undefined) record.suggestedTags = [];
        if (record.updatedAt === undefined) record.updatedAt = record.createdAt || Date.now();
      };

      trans.table('tasks').toCollection().modify(initializeSyncData);
      return trans.table('thoughts').toCollection().modify(initializeSyncData);
    });

    /**
     * [NEW 9.0] Version 9: Hệ thống Kỷ luật dữ liệu & Source Traceability
     * Bổ sung chỉ mục sourceTable để phục vụ Atomic Transaction và xử lý đồng bộ đa thiết bị.
     */
    this.version(9).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus, sourceTable', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus, sourceTable',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(trans => {
      /**
       * MIGRATION LOGIC: Gán nhãn nguồn vĩnh viễn cho dữ liệu cũ để phục vụ Bridge.
       */
      const tagTaskSource = (task: any) => {
        if (task.sourceTable === undefined) task.sourceTable = 'tasks';
      };
      const tagThoughtSource = (thought: any) => {
        if (thought.sourceTable === undefined) thought.sourceTable = 'thoughts';
      };

      trans.table('tasks').toCollection().modify(tagTaskSource);
      return trans.table('thoughts').toCollection().modify(tagThoughtSource);
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