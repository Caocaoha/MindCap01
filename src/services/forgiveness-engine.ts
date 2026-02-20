/**
 * [SERVICE]: Forgiveness Engine (v1.3.1)
 * [FIX]: Khắc phục lỗi TS2339 (type never) bằng cách ép kiểu dữ liệu từ Database.
 * Business Rule: Hỗ trợ so sánh chính xác đến từng phút (HH:mm) cho cả dữ liệu cũ và mới.
 */

import { db } from '../database/db';
import { useNotificationStore } from '../store/notification-store';

export const ForgivenessEngine = {
  getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  },

  async checkAndRun() {
    try {
      const profile = await db.userProfile.toCollection().first();
      if (!profile) return;

      const now = new Date();
      const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();

      /**
       * [FIX]: Ép kiểu thành 'any' hoặc 'string | number' để vượt qua kiểm tra nghiêm ngặt của TS
       * khi interface chưa được cập nhật đồng bộ.
       */
      const storedValue = profile.forgivenessHour as any;
      let targetTotalMinutes = 19 * 60; // Mặc định 19:00

      if (typeof storedValue === 'string' && storedValue.includes(':')) {
        const [h, m] = storedValue.split(':').map(Number);
        targetTotalMinutes = (h * 60) + (m || 0);
      } else if (typeof storedValue === 'number') {
        targetTotalMinutes = storedValue * 60;
      }

      const today = this.getTodayString();
      const lastRun = profile.lastForgivenessRun || '';

      if (currentTotalMinutes >= targetTotalMinutes && lastRun !== today) {
        console.log(`[Forgiveness] Kích hoạt tại mốc: ${storedValue}.`);
        await this.executeForgiveness(today);
      }
    } catch (error) {
      console.error("[Forgiveness Engine Error]:", error);
    }
  },

  async triggerCheckAfterUpdate() {
    await this.checkAndRun();
  },

  async executeForgiveness(today: string) {
    try {
      await db.transaction('rw', db.tasks, db.thoughts, db.userProfile, async () => {
        const focusTasksCount = await db.tasks
          .where('isFocusMode')
          .equals(1) 
          .modify({ isFocusMode: false });

        const focusThoughtsCount = await db.thoughts
          .where('isFocusMode')
          .equals(1)
          .modify({ isFocusMode: false });

        await db.userProfile.toCollection().modify({
          lastForgivenessRun: today
        });

        const totalCleared = focusTasksCount + focusThoughtsCount;
        
        if (totalCleared > 0) {
          const { showNotification } = useNotificationStore.getState();
          showNotification(
            "Hãy nghỉ ngơi! Bạn đã rất nỗ lực.", 
            undefined, 
            'forgiveness'
          );
        }
      });
    } catch (error) {
      console.error("[Forgiveness Execution Failed]:", error);
    }
  }
};