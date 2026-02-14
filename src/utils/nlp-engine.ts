/**
 * [ENGINE]: Bộ máy xử lý ngôn ngữ tinh gọn cho Mind Cap.
 * Giai đoạn 4.5: Chuẩn hóa tiếng Việt và Fuzzy Search logic.
 * Tối ưu hóa cho tốc độ xử lý trên thiết bị di động.
 */

/**
 * Loại bỏ dấu tiếng Việt và chuyển về chữ thường.
 * Giúp tìm kiếm "hoc" vẫn ra kết quả "học tập".
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Tách các ký tự dấu khỏi chữ cái gốc
    .replace(/[\u0300-\u036f]/g, '') // Xóa các ký tự dấu
    .replace(/đ/g, 'd') // Xử lý riêng chữ đ
    .replace(/Đ/g, 'd')
    .trim();
};

/**
 * Kiểm tra xem nội dung có khớp với từ khóa tìm kiếm hay không.
 * Hỗ trợ tìm kiếm theo Tag nếu từ khóa bắt đầu bằng #.
 */
export const matchesSearch = (content: string, tags: string[] | undefined, query: string): boolean => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  // 1. Logic tìm kiếm theo Tag (nếu bắt đầu bằng #)
  if (query.startsWith('#')) {
    const tagQuery = normalizedQuery.replace('#', '');
    return tags?.some(tag => normalizeText(taskTagCleanup(tag)).includes(tagQuery)) ?? false;
  }

  // 2. Logic tìm kiếm toàn văn (Full-text search)
  const normalizedContent = normalizeText(content);
  return normalizedContent.includes(normalizedQuery);
};

/**
 * Loại bỏ các tiền tố kỹ thuật của Tag (ví dụ p: hoặc freq:) để tìm kiếm tự nhiên.
 */
const taskTagCleanup = (tag: string): string => {
  if (tag.includes(':')) {
    return tag.split(':')[1];
  }
  return tag;
};

/**
 * [DÀNH CHO TƯƠNG LAI]: Trích xuất từ khóa quan trọng (Keywords Extraction).
 * Hiện tại hỗ trợ cơ bản việc tách từ để chuẩn bị cho hệ thống Echo/NLP Listener.
 */
export const extractKeywords = (text: string): string[] => {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2); // Chỉ lấy các từ có nghĩa từ 3 ký tự trở lên
};