// src/services/echo/constants.ts

// [EDGE CASE]: Chờ 4s sau khi ngừng gõ mới chạy để tránh "Hiệu ứng cánh bướm"
export const ECHO_DEBOUNCE_MS = 4000; 

// [PERFORMANCE]: Chỉ quét 1000 items gần nhất nếu DB quá lớn
export const MAX_SAMPLE_SIZE = 1000;

// [NLP]: Stopwords tiếng Việt cơ bản (Cần bổ sung thêm sau này)
export const VI_STOPWORDS = new Set([
  'là', 'của', 'và', 'những', 'cái', 'thì', 'mà', 'khi', 'đang', 'đã', 'sẽ', 
  'với', 'cho', 'tại', 'trong', 'trên', 'dưới', 'để', 'này', 'kia', 'đó', 
  'các', 'một', 'như', 'từ', 'có', 'không', 'làm'
]);