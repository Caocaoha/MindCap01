// src/features/gamification/utils.ts

import { db } from '../../core/db';

/**
 * Kiểm tra và reset bộ đếm hàng ngày nếu đã sang ngày mới
 */
export const syncDailyStats = async () => {
  const userState = await db.userState.get(1);
  if (!userState) return;

  const lastUpdate = new Date(userState.lastSyncDate || 0);
  const today = new Date();

  // Kiểm tra nếu ngày/tháng/năm khác nhau
  const isNewDay = 
    lastUpdate.getDate() !== today.getDate() ||
    lastUpdate.getMonth() !== today.getMonth() ||
    lastUpdate.getFullYear() !== today.getFullYear();

  if (isNewDay) {
    await db.userState.update(1, {
      dailyCounts: {}, // Reset sạch bộ đếm
      lastSyncDate: today.getTime()
    });
    console.log("CME: Daily counts reset for a new day.");
  }
};