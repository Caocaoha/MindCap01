/**
 * [SERVICE]: Unified Entry Service (entry-service.ts)
 * Purpose: Trung tâm điều phối lưu trữ duy nhất cho toàn bộ ứng dụng.
 * Phụ trách: Smart Routing (Saban/Focus) + Spark Notification (Waterfall).
 */

import { db } from '../database/db';
import { SparkEngine } from '../modules/spark/spark-engine';
import { NotificationManager } from '../modules/spark/notification-manager';
import { ITask, IThought } from '../database/types';

export const EntryService = {
  /**
   * Hàm lưu trữ tổng hợp cho mọi con đường nhập liệu.
   */
  async saveEntry(payload: any, type: 'task' | 'thought') {
    const now = Date.now();
    const content = payload.content.trim();
    const wordCount = content.split(/\s+/).length;
    
    let finalPayload = { ...payload, content, updatedAt: now };
    let routingMessage = "";

    try {
      // --- PHẦN 1: SMART ROUTING (Chỉ dành cho Task mới/chuyển đổi) ---
      if (type === 'task') {
        const allTasks = await db.tasks.toArray();
        const todoActiveCount = allTasks.filter(t => 
          !t.isFocusMode && t.archiveStatus === 'active' && t.status !== 'done'
        ).length;
        const focusSlotsCount = allTasks.filter(t => 
          t.isFocusMode && t.status !== 'done'
        ).length;

        // Lớp kiểm tra 2 cấp
        if (todoActiveCount === 0 && focusSlotsCount < 4) {
          finalPayload.isFocusMode = true;
          routingMessage = "🚀 Saban trống, đã đẩy thẳng vào Focus!";
        } else {
          finalPayload.isFocusMode = false;
          routingMessage = focusSlotsCount >= 4 
            ? "📥 Đã thêm vào Saban Todo (Focus đầy)." 
            : "📥 Đã thêm nhiệm vụ vào Saban Todo.";
        }
      } else {
        routingMessage = "📝 Đã gieo một nhận thức vào Nhật ký.";
      }

      // --- PHẦN 2: SPARK WATERFALL LOGIC ---
      // Tính toán mốc thời gian nhắc nhở nếu nội dung > 16 từ [cite: 3, 4]
      const schedule = SparkEngine.calculateInitialSchedule(content);
      if (schedule.length > 0) {
        finalPayload.nextReviewAt = schedule; // Mảng [10p, 24h, 72h]
      }

      // --- PHẦN 3: COMMIT TO DATABASE ---
      const table = type === 'task' ? db.tasks : db.thoughts;
      let id: number;

      if (payload.id) {
        await (table as any).update(payload.id, finalPayload);
        id = payload.id;
      } else {
        id = await (table as any).add({ ...finalPayload, createdAt: now });
      }

      const savedRecord = { ...finalPayload, id, sourceTable: type === 'task' ? 'tasks' : 'thoughts' };

      // --- PHẦN 4: ACTIVATE NOTIFICATION MANAGER ---
      // Đây là bước quan trọng nhất để sửa lỗi mất thông báo [cite: 18, 22]
      if (schedule.length > 0) {
        NotificationManager.scheduleWaterfall(id, type, content, schedule);
      }

      return { success: true, record: savedRecord, message: routingMessage };
    } catch (error) {
      console.error("[EntryService Error]:", error);
      throw error;
    }
  }
};