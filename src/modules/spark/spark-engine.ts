import { db } from '../../database/db';

/**
 * [SERVICE]: Spark Waterfall Engine (v2.2)
 * Business Rule: 
 * - Giai đoạn 1: Kích hoạt cho bản ghi > 16 từ (10p, 24h, 72h).
 * - Giai đoạn 2: Gia hạn nếu được Bookmark (7 ngày, 30 ngày, 4 tháng).
 * - [NEW 2.2]: Tích hợp lưu trữ vào IndexedDB phục vụ Catch-up Logic để fix lỗi trễ giờ.
 */

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
   * Tính toán các mốc thời gian khởi tạo.
   */
  calculateInitialSchedule(content: string): number[] {
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount <= 16) return [];

    const now = Date.now();
    return [
      now + INTERVALS.TEN_MINUTES,
      now + INTERVALS.ONE_DAY,
      now + INTERVALS.THREE_DAYS
    ];
  },

  /**
   * Tính toán các mốc thời gian gia hạn (Bookmark).
   */
  calculateExtendedSchedule(createdAt: number): number[] {
    const now = Date.now();
    if (now - createdAt > INTERVALS.THREE_DAYS) return [];

    return [
      createdAt + INTERVALS.SEVEN_DAYS,
      createdAt + INTERVALS.THIRTY_DAYS,
      createdAt + INTERVALS.FOUR_MONTHS
    ];
  },

  /**
   * [NEW]: Ghi các mốc khởi tạo vào Database để Service Worker quét ngầm.
   */
  async registerInitialSchedules(entryId: number, entryType: 'tasks' | 'thoughts', content: string) {
    const scheduleTimes = this.calculateInitialSchedule(content);
    if (scheduleTimes.length === 0) return;

    const records = scheduleTimes.map(time => ({
      entryId,
      entryType,
      content,
      scheduledAt: time,
      status: 'pending' as const,
      createdAt: Date.now()
    }));

    // Lưu hàng loạt vào bảng sparkSchedules phục vụ Catch-up Logic
    await db.sparkSchedules.bulkAdd(records);
    console.log(`[Spark Engine] Đã lưu ${records.length} mốc thông báo khởi tạo cho ${entryType}:${entryId}`);
  },

  /**
   * [NEW]: Ghi các mốc gia hạn vào Database khi người dùng nhấn Bookmark.
   */
  async registerExtendedSchedules(entryId: number, entryType: 'tasks' | 'thoughts', content: string, createdAt: number) {
    const scheduleTimes = this.calculateExtendedSchedule(createdAt);
    if (scheduleTimes.length === 0) return;

    const records = scheduleTimes.map(time => ({
      entryId,
      entryType,
      content,
      scheduledAt: time,
      status: 'pending' as const,
      createdAt: Date.now()
    }));

    await db.sparkSchedules.bulkAdd(records);
    console.log(`[Spark Engine] Đã lưu ${records.length} mốc thông báo gia hạn cho ${entryType}:${entryId}`);
  }
};