import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';

/**
 * [SERVICE]: Spark Scoring & Timing Engine.
 * Hợp nhất thuật toán lập lịch Waterfall và hệ thống ghi điểm tương tác (Scoring).
 * Tuân thủ Blueprint V2.0 và quy hoạch kebab-case.
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

// --- PHẦN 1: SPARK ENGINE (WATERFALL LOGIC) ---
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

// --- PHẦN 2: SCORING ENGINE (ATTENTION FUEL) ---
export const SparkScoringEngine = {
  /**
   * Cập nhật điểm tương tác cho một bản ghi cụ thể (Atomic Update).
   * @param entryId - ID của Task hoặc Thought.
   * @param type - Loại bảng để truy vấn.
   * @param points - Số điểm (+1, +5, +10).
   */
  async update_score(
    entryId: number, 
    type: 'task' | 'thought', 
    points: number
  ): Promise<void> {
    if (!entryId) return;

    try {
      const table = type === 'task' ? db.tasks : db.thoughts;
      
      const entry = await table.get(entryId);
      if (!entry) return;

      const currentScore = entry.interactionScore || 0;
      const newScore = currentScore + points;

      /**
       * Cập nhật Denormalization fields phục vụ Pooling.
       * lastInteractedAt giúp thuật toán xác định độ "tươi" của ký ức Trending.
       */
      await table.update(entryId, {
        interactionScore: newScore,
        lastInteractedAt: Date.now()
      });

      console.log(`[Spark Score] ${type}:${entryId} +${points} -> ${newScore}`);
    } catch (error) {
      console.error(`[Spark Score Error] Entry ID: ${entryId}`, error);
    }
  },

  /**
   * [SCORING ACTION]: Passive View (+1 điểm).
   * Kích hoạt khi bản ghi xuất hiện trên màn hình > 3 giây.
   */
  async triggerPassiveView(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.update_score(entryId, type, 1);
  },

  /**
   * [SCORING ACTION]: Active View (+5 điểm).
   * Kích hoạt khi người dùng click xem chi tiết bản ghi.
   */
  async triggerActiveView(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.update_score(entryId, type, 5);
  },

  /**
   * [SCORING ACTION]: Creative Action (+10 điểm).
   * CHỈ kích hoạt khi tạo liên kết ngữ nghĩa mới (Semantic Link).
   * RÀNG BUỘC: Không cộng điểm cho hành động chỉnh sửa văn bản.
   */
  async triggerCreativeAction(entryId: number, type: 'task' | 'thought'): Promise<void> {
    await this.update_score(entryId, type, 10);
  }
};