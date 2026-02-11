// src/services/cme/engine.ts
import { 
    ActionType, 
    SCORING_TABLE, 
    LEVEL_THRESHOLDS, 
    BASE_THRESHOLD_L8, 
    STEP_L8_PLUS 
  } from './constants';
  
  /**
   * Tính điểm dựa trên số lần đã thực hiện trong ngày (Diminishing Returns)
   * @param type Loại hành động
   * @param currentDailyCount Số lần ĐÃ thực hiện trước đó trong ngày
   */
  export const calculatePoints = (type: ActionType, currentDailyCount: number): number => {
    const scores = SCORING_TABLE[type];
    
    // 4 lần đầu (0, 1, 2, 3) -> High Tier
    if (currentDailyCount < 4) return scores[0];
    
    // Lần 5 - 9 (4, 5, 6, 7, 8) -> Low Tier
    if (currentDailyCount < 9) return scores[1];
    
    // Từ lần 10+ -> Minimal Tier
    return scores[2];
  };
  
  /**
   * Tính ngưỡng điểm cần thiết để đạt Level tiếp theo
   */
  export const getNextLevelThreshold = (currentLevel: number): number => {
    if (currentLevel < 7) {
      return LEVEL_THRESHOLDS[currentLevel + 1];
    }
    // Từ Level 7 lên 8 (và cao hơn): Base + (Level hiện tại - 7) * 500
    // Ví dụ: Đang ở L7 (2000), cần lên L8. Ngưỡng = 2000 + (7-7)*500 + 500? 
    // Theo Spec: Từ cấp 8 trở đi: Threshold + 500. 
    // Logic chuẩn: Threshold(L) = 2000 + (L - 7) * 500
    return BASE_THRESHOLD_L8 + (currentLevel - 7) * STEP_L8_PLUS;
  };
  
  /**
   * Kiểm tra xem có cần reset bộ đếm ngày không
   */
  export const shouldResetDaily = (lastResetTimestamp: number): boolean => {
    const lastDate = new Date(lastResetTimestamp);
    const now = new Date();
    
    return (
      lastDate.getDate() !== now.getDate() ||
      lastDate.getMonth() !== now.getMonth() ||
      lastDate.getFullYear() !== now.getFullYear()
    );
  };