/**
 * Tiện ích xử lý thời gian cho Mind OS v3.1
 */

// Tạo chuỗi định dạng YYYY-MM-DD để lưu vào date_str trong DB
export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

// Kiểm tra xem đã qua ngày mới chưa để thực hiện Midnight Reset
export const shouldResetMidnight = (lastResetDateStr: string): boolean => {
  const todayStr = getDateString();
  return todayStr !== lastResetDateStr;
};

// Định dạng hiển thị ngày tháng thân thiện cho giao diện (Ví dụ: "Thứ Hai, 5 thg 2")
export const formatDisplayDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
};

// Tính toán thời gian focus liên tục (hỗ trợ useMindTimer)
export const isLongEnoughFocus = (startTime: number): boolean => {
  const duration = (Date.now() - startTime) / 1000;
  return duration >= 4; // Chỉ ghi log nếu > 04 giây [cite: 25]
};