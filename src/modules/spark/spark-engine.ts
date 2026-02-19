/**
 * [SERVICE]: Spark Waterfall Engine (v2.1)
 * Business Rule: 
 * - Giai đoạn 1: Kích hoạt cho bản ghi > 16 từ (10p, 24h, 72h).
 * - Giai đoạn 2: Gia hạn nếu được Bookmark (7 ngày, 30 ngày, 4 tháng).
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

  calculateExtendedSchedule(createdAt: number): number[] {
    const now = Date.now();
    if (now - createdAt > INTERVALS.THREE_DAYS) return [];

    return [
      createdAt + INTERVALS.SEVEN_DAYS,
      createdAt + INTERVALS.THIRTY_DAYS,
      createdAt + INTERVALS.FOUR_MONTHS
    ];
  }
};