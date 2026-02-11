// src/features/gamification/hooks/useGamification.ts
import { db } from '../../core/db';
import { calculateEarnedXP, checkLevelUp } from '../engine';
import { ActionType } from '../constants';

export const useGamification = () => {
  const awardXP = async (action: ActionType) => {
    // 1. Lấy trạng thái user hiện tại từ Dexie
    const userState = await db.userState.get(1); // Giả định ID user là 1
    if (!userState) return;

    // 2. Tính số lần action trong ngày (để áp dụng Diminishing Returns)
    const currentDailyCount = userState.dailyCounts[action] || 0;
    const earnedXP = calculateEarnedXP(action, currentDailyCount);

    // 3. Kiểm tra thăng cấp
    const { isLevelUp, newLevel } = checkLevelUp(userState.currentXP, earnedXP);

    // 4. Cập nhật Database
    await db.userState.update(1, {
      currentXP: userState.currentXP + earnedXP,
      level: newLevel,
      [`dailyCounts.${action}`]: currentDailyCount + 1
    });

    return {
      earnedXP,
      isLevelUp,
      newLevel,
      toastMessage: `+${earnedXP} XP - ${action}`
    };
  };

  return { awardXP };
};