/**
 * [ENGINE]: Bộ máy xử lý ngôn ngữ tinh gọn cho Mind Cap (v4.1).
 * Giai đoạn 6.11: Tích hợp NLP Parser bóc tách thực thể định lượng và lọc Stop-words.
 */

// [FIX]: Bổ sung đầy đủ các trường dữ liệu định lượng để đồng bộ với ITask và IThought
export interface INlpResult {
  original: string;
  normalized: string;
  keywords: string[];
  tokens: string[];
  tags: string[];
  sentiment?: number;
  // --- THỰC THỂ ĐỊNH LƯỢNG (ENTITIES) ---
  content: string;      // Nội dung đã lược bỏ thông số
  quantity?: number;    // Số lượng (Quantity)
  unit?: string;        // Đơn vị (Unit)
  frequency?: string;   // Tần suất (Frequency)
}

/**
 * Danh sách Stop-words tiếng Việt cơ bản để tinh lọc từ khóa.
 */
const STOP_WORDS = [
  'thi', 'la', 'ma', 'cai', 'chiec', 'cua', 'de', 'do', 'duoc', 'khi', 
  'nhung', 'nay', 'neu', 'nhu', 'roi', 'ta', 'toi', 'minh', 'va', 'co'
];

/**
 * Loại bỏ dấu tiếng Việt và chuyển về chữ thường.
 * Giúp tìm kiếm "hoc" vẫn ra kết quả "học tập".
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/đ/g, 'd') 
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

  if (query.startsWith('#')) {
    const tagQuery = normalizedQuery.replace('#', '');
    return tags?.some(tag => normalizeText(taskTagCleanup(tag)).includes(tagQuery)) ?? false;
  }

  const normalizedContent = normalizeText(content);
  return normalizedContent.includes(normalizedQuery);
};

/**
 * Loại bỏ các tiền tố kỹ thuật của Tag (ví dụ p: hoặc freq:).
 */
const taskTagCleanup = (tag: string): string => {
  if (tag.includes(':')) {
    return tag.split(':')[1];
  }
  return tag;
};

/**
 * Trích xuất từ khóa quan trọng (Keywords Extraction).
 * Loại bỏ stop-words và các từ ngắn vô nghĩa.
 */
export const extractKeywords = (text: string): string[] => {
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.includes(word)); 
};

/**
 * [CORE ANALYZER]: Bóc tách dữ liệu định lượng và phân tích văn bản.
 * Áp dụng cơ chế Regex để trích xuất Quantity, Unit, Frequency.
 */
export const analyze = (text: string): INlpResult => {
  const normalized = normalizeText(text);
  
  // 1. Trích xuất Tags (ví dụ #idea)
  const rawTags = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const tags = rawTags.map(t => t.replace('#', ''));

  // 2. Khởi tạo các giá trị định lượng
  let extractedQuantity: number | undefined = undefined;
  let extractedUnit: string | undefined = undefined;
  let extractedFrequency: string | undefined = undefined;
  let cleanContent = text;

  // 3. Regex cho Tần suất (Frequency)
  const freqRegex = /(moi ngay|hang ngay|hang tuan|moi tuan|hang thang|moi thang|hang gio|moi nam|hang nam|\d+\s*lan\s*\/\s*(ngay|tuan|thang))/i;
  const freqMatch = normalized.match(freqRegex);
  if (freqMatch) {
    extractedFrequency = freqMatch[0];
    // Xóa tần suất khỏi cleanContent bằng cách dùng vị trí từ bản normalized
    const startIndex = normalized.indexOf(extractedFrequency);
    cleanContent = cleanContent.substring(0, startIndex) + cleanContent.substring(startIndex + extractedFrequency.length);
  }

  // 4. Regex cho Số lượng & Đơn vị (Quantity & Unit)
  // Tìm số đứng trước các đơn vị phổ biến
  const unitRegex = /(\d+)\s*(phut|gio|tieng|lan|trang|km|m|kg|s|giay|bai|chuong|tap|ly|bat|chen)/i;
  const unitMatch = normalizeText(cleanContent).match(unitRegex);
  if (unitMatch) {
    extractedQuantity = parseInt(unitMatch[1], 10);
    extractedUnit = unitMatch[2];
    
    // Xóa Quantity/Unit khỏi cleanContent
    const normalizedPart = unitMatch[0];
    const startIndex = normalizeText(cleanContent).indexOf(normalizedPart);
    if (startIndex !== -1) {
      cleanContent = cleanContent.substring(0, startIndex) + cleanContent.substring(startIndex + normalizedPart.length);
    }
  }

  // Làm sạch Content cuối cùng
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

  return {
    original: text,
    normalized: normalized,
    keywords: extractKeywords(cleanContent),
    tokens: normalized.split(/\s+/),
    tags: tags,
    sentiment: 0,
    content: cleanContent,
    quantity: extractedQuantity,
    unit: extractedUnit,
    frequency: extractedFrequency
  };
};