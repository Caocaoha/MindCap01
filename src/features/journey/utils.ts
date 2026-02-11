import { startOfDay, differenceInDays } from 'date-fns';

// Cấu hình vật lý
const MAX_ENTROPY_DAYS = 40; // Sau 40 ngày sẽ mờ hẳn nếu không bookmark
const TODAY_START = startOfDay(new Date()).getTime();

/**
 * Tính toán độ mờ (Opacity) dựa trên thời gian trôi qua
 */
export const calculateEntropy = (timestamp: number, isBookmarked: boolean): number => {
  if (isBookmarked) return 1; // Hạt giống vĩnh cửu

  const daysPassed = differenceInDays(Date.now(), timestamp);
  
  if (daysPassed >= MAX_ENTROPY_DAYS) return 0; // Tan biến
  if (daysPassed < 1) return 1; // Mới tinh

  // Công thức tuyến tính: 1 -> 0 trong 40 ngày
  return Math.max(0.1, 1 - (daysPassed / MAX_ENTROPY_DAYS)); 
};

/**
 * Kiểm tra xem bản ghi có thuộc về "Quá khứ" không
 * (Trước 00:00 hôm nay)
 */
export const isFromPast = (timestamp: number): boolean => {
  return timestamp < TODAY_START;
};