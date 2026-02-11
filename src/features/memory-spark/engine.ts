// src/features/memory-spark/engine.ts

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;

/**
 * Tính toán thời điểm nhắc lại tiếp theo
 * @returns Timestamp hoặc null nếu kết thúc luồng nhắc lại
 */
export const calculateNextReview = (
  currentStage: number, 
  isBookmarked: boolean
): number | null => {
  const now = Date.now();

  // Quy tắc nhảy Stage dựa trên Bookmark (R3-R5 yêu cầu Bookmark)
  if (currentStage >= 2 && !isBookmarked) {
    return null; // Kết thúc luồng Spark nếu không được Bookmark sau R2
  }

  const STAGE_INTERVALS: Record<number, number> = {
    0: 10 * MS_MINUTE,  // New -> R1: 10 phút
    1: 24 * MS_HOUR,    // R1 -> R2: 24 giờ
    2: 72 * MS_HOUR,    // R2 -> R3: 72 giờ
    3: 10 * MS_DAY,     // R3 -> R4: 10 ngày (Requires Bookmark)
    4: 30 * MS_DAY,     // R4 -> R5: 30 ngày (Requires Bookmark)
    5: 120 * MS_DAY,    // R5 -> Kết thúc: 4 tháng (Requires Bookmark)
  };

  const interval = STAGE_INTERVALS[currentStage];
  return interval ? now + interval : null;
};

/**
 * Tiện ích đếm từ (NLP Lite helper)
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};