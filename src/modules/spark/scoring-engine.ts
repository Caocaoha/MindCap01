/**
 * [SERVICE]: Spark Scoring Engine.
 * Purpose: Tính toán điểm tương tác dựa trên hành vi thực tế của người dùng.
 * Business Rule: 
 * - Passive View (+1), Active View (+5), Creative Action (+10)[cite: 29, 30, 31].
 * - Denormalization: Lưu trực tiếp vào bản ghi để tối ưu hiệu suất truy vấn[cite: 23].
 */

import { db } from '../../database/db';

export const ScoringEngine = {
  /**
   * Cập nhật điểm tương tác tổng hợp (Atomic Update)[cite: 27].
   */
  async updateScore(
    entryId: number, 
    type: 'task' | 'thought', 
    points: number
  ): Promise<void> {
    if (!entryId) return;

    try {
      const table = type === 'task' ? db.tasks : db.thoughts;
      const entry = await table.get(entryId);
      if (!entry) return;

      const newScore = (entry.interactionScore || 0) + points;

      // Lưu trạng thái tương tác mới nhất để thuật toán Pooling xác định độ "nóng" [cite: 27]
      await table.update(entryId, {
        interactionScore: newScore,
        lastInteractedAt: Date.now()
      });

      console.log(`[Spark Score] ${type}:${entryId} +${points} -> ${newScore}`);
    } catch (error) {
      console.error(`[Scoring Error] ID: ${entryId}`, error);
    }
  },

  /**
   * Tương tác thụ động: Nhìn thấy bản ghi trên màn hình[cite: 29].
   */
  async triggerPassiveView(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.updateScore(entryId, type, 1);
  },

  /**
   * Tương tác chủ động: Click vào xem chi tiết[cite: 30].
   */
  async triggerActiveView(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.updateScore(entryId, type, 5);
  },

  /**
   * Hành động sáng tạo: Tạo liên kết tri thức (Semantic Link)[cite: 31].
   */
  async triggerCreativeAction(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.updateScore(entryId, type, 10);
  }
};