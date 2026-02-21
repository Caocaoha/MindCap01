/**
 * Purpose: MindCap Core Database Controller - Quản lý lưu trữ IndexedDB bằng Dexie.js (v12.0).
 * Inputs/Outputs: Khởi tạo database, thực hiện migration dữ liệu.
 * Business Rule: 
 * - Quản lý phiên bản và lược đồ lưu trữ đồng bộ.
 * - [NEW 9.1]: Tích hợp chỉ mục sourceTable để định danh tuyệt đối nguồn dữ liệu.
 * - [NEW 10.0]: Bổ sung bảng sparkSchedules để hỗ trợ Catch-up Logic, đảm bảo thông báo chính xác.
 * - [NEW 11.0]: Tích hợp cấu hình Forgiveness Hour (Giờ tha thứ) vào User Profile.
 * - [NEW 12.0]: Chuyển đổi toàn bộ hệ thống sang ISO 8601 (UTC Agnostic) và lập chỉ mục updatedAt.
 * - Đảm bảo tính nhất quán dữ liệu qua cơ chế Atomic Migration trên môi trường Cloudflare.
 */

import Dexie, { type Table } from 'dexie';
import type { ITask, IThought, IMood, IUserProfile, ISparkSchedule } from './types';

export class MindCapDatabase extends Dexie {
  tasks!: Table<ITask, number>;
  thoughts!: Table<IThought, number>;
  moods!: Table<IMood, number>;
  userProfile!: Table<IUserProfile, number>;
  // [NEW 10.0]: Bảng lưu trữ các mốc thời gian thông báo chạy ngầm.
  sparkSchedules!: Table<ISparkSchedule, number>;

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
     * [NEW 9.1] Version 9: Hệ thống Kỷ luật dữ liệu & Source Traceability
     */
    this.version(9).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus, sourceTable', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus, sourceTable',
      moods: '++id, score, createdAt',
      userProfile: '++id'
    }).upgrade(async (trans) => {
      await Promise.all([
        trans.table('tasks').toCollection().modify(task => {
          if (task.sourceTable === undefined) task.sourceTable = 'tasks';
        }),
        trans.table('thoughts').toCollection().modify(thought => {
          if (thought.sourceTable === undefined) thought.sourceTable = 'thoughts';
        })
      ]);
    });

    /**
     * [NEW 10.0] Version 10: Tích hợp Catch-up Logic cho Spark Notification.
     */
    this.version(10).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus, sourceTable', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus, sourceTable',
      moods: '++id, score, createdAt',
      userProfile: '++id',
      sparkSchedules: '++id, entryId, entryType, scheduledAt, status'
    });

    /**
     * [NEW 11.0] Version 11: Tích hợp Cơ chế Giờ tha thứ (Forgiveness Hour).
     */
    this.version(11).stores({
      tasks: '++id, status, createdAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus, sourceTable', 
      thoughts: '++id, type, createdAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus, sourceTable',
      moods: '++id, score, createdAt',
      userProfile: '++id',
      sparkSchedules: '++id, entryId, entryType, scheduledAt, status'
    }).upgrade(async (trans) => {
      await trans.table('userProfile').toCollection().modify(profile => {
        if (profile.forgivenessHour === undefined) profile.forgivenessHour = 19;
        if (profile.lastForgivenessRun === undefined) profile.lastForgivenessRun = '';
      });
    });

    /**
     * [NEW 12.0] Version 12: Nâng cấp chuẩn ISO 8601 (Timezone Agnostic) & Sanitization.
     * [FIX]: Lập chỉ mục updatedAt để tối ưu truy vấn cho streakEngine.
     * [FIX]: Tự động kéo dữ liệu từ tương lai về thực tế.
     */
    this.version(12).stores({
      tasks: '++id, status, createdAt, updatedAt, isFocusMode, scheduledFor, *tags, doneCount, targetCount, nextReviewAt, interactionScore, echoLinkCount, parentId, parentGroupId, archiveStatus, syncStatus, sourceTable', 
      thoughts: '++id, type, createdAt, updatedAt, nextReviewAt, interactionScore, echoLinkCount, parentId, syncStatus, sourceTable',
      moods: '++id, score, createdAt',
      userProfile: '++id',
      sparkSchedules: '++id, entryId, entryType, scheduledAt, status'
    }).upgrade(async (trans) => {
      const now = Date.now();
      
      // Hàm hỗ trợ làm sạch và chuyển đổi sang ISO 8601
      const sanitizeToISO = (val: any) => {
        if (!val) return new Date(now).toISOString();
        let ts = typeof val === 'string' ? new Date(val).getTime() : Number(val);
        if (isNaN(ts)) ts = now;
        
        // [CORE FIX]: Nếu mốc thời gian lớn hơn hiện tại (Lỗi 2027), kéo về hiện tại.
        if (ts > now) ts = now;
        
        return new Date(ts).toISOString();
      };

      await Promise.all([
        trans.table('tasks').toCollection().modify(task => {
          task.createdAt = sanitizeToISO(task.createdAt);
          task.updatedAt = sanitizeToISO(task.updatedAt);
          if (task.scheduledFor) task.scheduledFor = sanitizeToISO(task.scheduledFor);
        }),
        trans.table('thoughts').toCollection().modify(thought => {
          thought.createdAt = sanitizeToISO(thought.createdAt);
          thought.updatedAt = sanitizeToISO(thought.updatedAt);
        })
      ]);

      console.log("MindCap Database: Version 12 migration (ISO 8601 & Future Date Sanitization) completed.");
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