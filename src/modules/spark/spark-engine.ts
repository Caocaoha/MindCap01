/**
 * [SERVICE]: Spark Waterfall Engine.
 * Purpose: Quản lý logic lập lịch thông báo để gia hạn ký ức.
 * Business Rule: 
 * - Giai đoạn 1: Kích hoạt cho bản ghi > 16 từ (10p, 24h, 72h)[cite: 3, 4].
 * - Giai đoạn 2: Gia hạn nếu được Bookmark (7 ngày, 30 ngày, 4 tháng)[cite: 5, 6].
 * - Tự động dừng nhắc nhở sau 72h nếu không có Bookmark[cite: 7].
 */

import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';

const INTERVALS = {
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THREE_DAYS: 72 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
  FOUR_MONTHS: 120 * 24 * 60 * 60 * 1000,
};

export const SparkEngine = {
  /**
   * Tính toán các mốc thông báo khởi tạo cho bản ghi mới.
   */
  calculateInitialSchedule(content: string): number[] {
    const wordCount = content.trim().split(/\s+/).length;
    
    // Chỉ kích hoạt nếu nội dung > 16 từ [cite: 3]
    if (wordCount <= 16) return [];

    const now = Date.now();
    return [
      now + INTERVALS.TEN_MINUTES,
      now + INTERVALS.ONE_DAY,
      now + INTERVALS.THREE_DAYS
    ];
  },

  /**
   * Tính toán các mốc mở rộng khi người dùng nhấn Bookmark[cite: 5, 6].
   */
  calculateExtendedSchedule(createdAt: number): number[] {
    const now = Date.now();
    const age = now - createdAt;
    
    // Chỉ gia hạn nếu bản ghi "tươi" (dưới 72 giờ) [cite: 5]
    if (age > INTERVALS.THREE_DAYS) return [];

    return [
      createdAt + INTERVALS.SEVEN_DAYS,
      createdAt + INTERVALS.THIRTY_DAYS,
      createdAt + INTERVALS.FOUR_MONTHS
    ];
  },

  /**
   * Kiểm tra điều kiện duy trì chu trình nhắc nhở[cite: 7].
   */
  shouldContinueReview(entry: ITask | IThought): boolean {
    const now = Date.now();
    const age = now - entry.createdAt;

    // Sau 72h không Bookmark -> Dừng nhắc để tránh nhiễu [cite: 7]
    if (age > INTERVALS.THREE_DAYS && !entry.isBookmarked) {
      return false;
    }

    return true;
  }
};