// src/features/memory-spark/scheduler.ts
import { db } from '../../core/db';

class SparkScheduler {
  private timer: NodeJS.Timeout | null = null;
  private nextSparkId: string | null = null;

  /**
   * Tìm bản ghi có nextReviewAt sớm nhất trong tương lai
   */
  async findNextSpark() {
    const now = Date.now();
    // Dexie query sử dụng index cực nhanh
    const nextRecord = await db.tasks
      .where('nextReviewAt')
      .above(now)
      .sortBy('nextReviewAt');

    return nextRecord[0] || null;
  }

  /**
   * Thiết lập bộ đếm giờ duy nhất
   */
  async reSchedule(onTrigger: (id: string) => void) {
    // 1. Dọn dẹp timer cũ nếu có
    if (this.timer) clearTimeout(this.timer);

    // 2. Tìm "Kẻ tiếp theo"
    const nextOne = await this.findNextSpark();
    if (!nextOne) {
      console.log("MEM: No future sparks found.");
      return;
    }

    this.nextSparkId = nextOne.id;
    const delay = nextOne.nextReviewAt - Date.now();

    console.log(`MEM: Next spark in ${Math.round(delay/1000)}s: ${nextOne.id}`);

    // 3. Đặt báo thức
    this.timer = setTimeout(() => {
      onTrigger(nextOne.id);
    }, Math.max(0, delay));
  }
}

export const scheduler = new SparkScheduler();