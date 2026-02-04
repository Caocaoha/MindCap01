// src/utils/date.ts
export const getDateMetadata = (date: Date = new Date()) => {
    // Format YYYY-MM-DD an toàn theo local time
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -1);
    const date_str = localISOTime.split('T')[0];
  
    return {
      timestamp: date.getTime(),
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Đã xử lý +1 tại đây
      date_str: date_str
    };
  };