// src/utils/haptic.ts

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,             // Rung nhẹ 10ms
  medium: 40,            // Rung vừa
  heavy: 80,             // Rung mạnh (cho các tác vụ xóa/quan trọng)
  success: [10, 30, 10], // Rung 2 nhịp nhanh
  warning: [30, 50, 30], // Rung cảnh báo
  error: [50, 100, 50, 100, 50] // Rung dài ngắt quãng
};

/**
 * [NEW] Quản lý rung phản hồi
 * Chỉ hoạt động trên Mobile và nếu Browser hỗ trợ navigator.vibrate
 */
export const triggerHaptic = (type: HapticType = 'light') => {
  // Kiểm tra hỗ trợ phần cứng
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      // TODO: Kết nối với SettingStore để kiểm tra user có tắt rung không
      // Hiện tại mặc định là BẬT
      navigator.vibrate(PATTERNS[type]);
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
    }
  }
};
/**
 * [UTILS]: Quản lý rung phản hồi (Haptic Feedback)
 */
export const haptic = {
  // Rung nhẹ khi nhảy 1 đơn vị (Bánh răng)
  impactLight: () => {
    if (navigator.vibrate) navigator.vibrate(10);
  },
  
  // Rung trung bình khi đạt mốc quan trọng
  impactMedium: () => {
    if (navigator.vibrate) navigator.vibrate(30);
  },
  
  // Rung mạnh/dài khi hoàn thành (Success)
  success: () => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  },
  
  // Rung cảnh báo lỗi
  error: () => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }
};