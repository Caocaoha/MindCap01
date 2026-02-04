export const getDateMetadata = () => {
  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  
  return {
    timestamp: now.getTime(),
    date_str: now.toISOString().split('T')[0],
    dayOfWeek: days[now.getDay()],
    fullDate: `Ngày ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`,
    hour: now.getHours()
  };
};