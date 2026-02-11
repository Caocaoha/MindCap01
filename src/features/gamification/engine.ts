// src/features/gamification/engine.ts
import { XP_CONFIG, ActionType, LEVEL_THRESHOLD } from './constants';
import { IUserState } from '../../types';

/**
 * Tính toán XP thực nhận dựa trên cơ chế Diminishing Returns
 */
export const calculateEarnedXP = (action: ActionType, dailyCount: number): number => {
  const config = XP_CONFIG[action];
  if (dailyCount < config.steps.length) {
    return config.steps[dailyCount];
  }
  return config.floor;
};

/**
 * Kiểm tra xem người dùng có lên cấp không
 */
export const checkLevelUp = (currentXP: number, earnedXP: number) => {
  const oldLevel = Math.floor(currentXP / LEVEL_THRESHOLD);
  const newLevel = Math.floor((currentXP + earnedXP) / LEVEL_THRESHOLD);
  return {
    isLevelUp: newLevel > oldLevel,
    newLevel
  };
};

/**
 * Xác định Archetype dựa trên chỉ số EA (Effort Allocation) và độ sâu nội dung
 */
export const determineArchetype = (state: IUserState, avgWordCount: number) => {
  const { ea_score, cpi_score } = state;

  if (ea_score > 70) return 'Manager';
  if (ea_score <= 30 && avgWordCount > 40) return 'Explorer';
  if (ea_score > 40 && ea_score < 60 && cpi_score > 50) return 'Harmonizer';
  
  return 'Newbie';
};