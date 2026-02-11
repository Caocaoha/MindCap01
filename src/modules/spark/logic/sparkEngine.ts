// src/modules/spark/logic/sparkEngine.ts
import { db } from '../../../database/db';
import { BaseEntity } from '../../../database/types';

export const SparkEngine = {
  /**
   * Tính toán thời điểm review tiếp theo dựa trên số lần đã review
   */
  calculateNextInterval(entry: BaseEntity): number | null {
    const count = entry.reviewCount || 0;
    const isBookmarked = entry.isBookmarked || false;
    const wordCount = entry.wordCount || 0;

    // Giai đoạn 0: Mới tạo & Dài (> 16 từ) -> Nhắc sau 10 phút
    if (count === 0) {
       return wordCount > 16 ? 10 * 60 * 1000 : null; 
    }

    // Giai đoạn 1 (R1): Sau lần xem đầu -> +24h
    if (count === 1) return 24 * 60 * 60 * 1000;

    // Giai đoạn 2 (R2): Sau lần xem hai -> +72h
    if (count === 2) return 72 * 60 * 60 * 1000;

    // Giai đoạn 3+ (R3-R5): Chỉ áp dụng cho Bookmark (Hạt giống)
    if (isBookmarked) {
      if (count === 3) return 10 * 24 * 60 * 60 * 1000; // 10 ngày
      if (count === 4) return 30 * 24 * 60 * 60 * 1000; // 30 ngày
      return 120 * 24 * 60 * 60 * 1000; // 4 tháng
    }

    return null; // Kết thúc vòng đời Spark
  },

  /**
   * Thực hiện hành động "Đã nhớ" (Reviewed)
   */
  async processReview(entry: BaseEntity, type: 'task' | 'thought') {
    const currentCount = entry.reviewCount || 0;
    const nextCount = currentCount + 1;
    
    // Tính interval cơ bản
    let interval = this.calculateNextInterval({ ...entry, reviewCount: nextCount });
    
    // [ECHO INTEGRATION] Bonus: Nếu có nhiều liên kết, nhắc sớm hơn 10%
    if (interval && entry.linkedIds && entry.linkedIds.length > 3) {
      interval = interval * 0.9;
    }

    const updates: any = {
      reviewCount: nextCount,
      nextReviewAt: interval ? Date.now() + interval : null,
      updatedAt: Date.now() // [JOURNEY INTEGRATION] Reset Entropy (Làm sáng lại)
    };
    
    // Update DB
    if (type === 'task') await db.tasks.update(entry.id, updates);
    else await db.thoughts.update(entry.id, updates);
    
    return updates.nextReviewAt;
  },
  
  /**
   * Khởi tạo Spark khi tạo mới Entry (Gọi ở InputModule)
   */
  getInitialReviewTime(wordCount: number): number | null {
    // Nếu > 16 từ, set nextReviewAt = now + 10 mins
    return wordCount > 16 ? Date.now() + (10 * 60 * 1000) : null;
  }
};