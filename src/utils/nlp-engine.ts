/**
 * [ENGINE]: Bộ máy xử lý ngôn ngữ tinh gọn cho Mind Cap.
 * Giai đoạn 4.6: [HOTFIX V2] Bổ sung 'tokens' và 'tags' vào INlpResult.
 * Sửa lỗi build Cloudflare TS2339 cho Reactive Engine.
 */

// [FIX]: Bổ sung đầy đủ các trường dữ liệu mà Reactive Engine yêu cầu
export interface INlpResult {
  original: string;
  normalized: string;
  keywords: string[];
  tokens: string[]; // [NEW]: Danh sách các từ đơn
  tags: string[];   // [NEW]: Danh sách hashtag tìm thấy trong văn bản
  sentiment?: number;
}

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
 * Trích xuất từ khóa quan trọng (Keywords Extraction).
 */
export const extractKeywords = (text: string): string[] => {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2); // Chỉ lấy các từ có nghĩa từ 3 ký tự trở lên
};

// [FIX]: Cập nhật hàm analyze để trả về tokens và tags
export const analyze = (text: string): INlpResult => {
  const normalized = normalizeText(text);
  
  // Trích xuất tags (các từ bắt đầu bằng #, ví dụ #idea)
  // Regex bắt các ký tự chữ, số và gạch dưới sau dấu #
  const rawTags = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const tags = rawTags.map(t => t.replace('#', '')); // Loại bỏ dấu # để lưu trữ

  return {
    original: text,
    normalized: normalized,
    keywords: extractKeywords(text),
    tokens: normalized.split(/\s+/), // Tách chuỗi thành mảng các token
    tags: tags,
    sentiment: 0 // Default neutral sentiment
  };
};