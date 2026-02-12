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