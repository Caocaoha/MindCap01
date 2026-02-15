import { ITask, IThought } from '../../database/types';

/**
 * [SERVICE]: Spark Engine - Waterfall Spaced Repetition Logic.
 * Quản lý thuật toán lập lịch thông báo theo giai đoạn.
 */

// Định nghĩa các khoảng thời gian (Miliseconds)
const INTERVALS = {
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THREE_DAYS: 72 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
  FOUR_MONTHS: 120 * 24 * 60 * 60 * 1000, // Ước tính 4 tháng
};

export const SparkEngine = {
  /**
   * Tính toán các mốc thông báo cho Entry mới.
   * Giai đoạn 1: Nội dung > 16 từ sẽ có 3 mốc (10p, 24h, 72h).
   */
  calculateInitialSchedule(content: string): number[] {
    const wordCount = content.trim().split(/\s+/).length;
    
    // Điều kiện: Độ dài nội dung phải > 16 từ
    if (wordCount <= 16) return [];

    const now = Date.now();
    return [
      now + INTERVALS.TEN_MINUTES,
      now + INTERVALS.ONE_DAY,
      now + INTERVALS.THREE_DAYS
    ];
  },

  /**
   * Tính toán các mốc nâng cấp cho Entry đã Bookmark.
   * Giai đoạn 2: Giữ lịch cũ + thêm mốc (7 ngày, 30 ngày, 4 tháng).
   */
  calculateExtendedSchedule(createdAt: number): number[] {
    // Chỉ gia hạn nếu được bookmark trong vòng 72 giờ đầu tiên
    const now = Date.now();
    const age = now - createdAt;
    
    if (age > INTERVALS.THREE_DAYS) return [];

    return [
      createdAt + INTERVALS.SEVEN_DAYS,
      createdAt + INTERVALS.THIRTY_DAYS,
      createdAt + INTERVALS.FOUR_MONTHS
    ];
  },

  /**
   * Kiểm tra xem một bản ghi có đủ điều kiện tiếp tục chu trình nhắc nhở hay không.
   * Nếu sau 72 giờ không được Bookmark, hệ thống sẽ dừng nhắc.
   */
  shouldContinueReview(entry: ITask | IThought): boolean {
    const now = Date.now();
    const age = now - entry.createdAt;

    // Nếu đã qua 72 giờ mà chưa bookmark thì dừng
    if (age > INTERVALS.THREE_DAYS && !entry.isBookmarked) {
      return false;
    }

    return true;
  }
};