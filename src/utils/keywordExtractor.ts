// src/utils/keywordExtractor.ts

// Danh sách Stop-words cơ bản (Tiếng Việt & Tiếng Anh) để loại bỏ nhiễu
const STOP_WORDS = new Set([
    'của', 'và', 'là', 'có', 'cho', 'với', 'trong', 'để', 'này', 'vừa', 'theo',
    'the', 'and', 'is', 'for', 'with', 'in', 'this', 'that', 'it', 'my', 'your'
  ]);
  
  /**
   * Trích xuất từ khóa quan trọng từ nội dung văn bản
   */
  export const extractKeywords = (text: string): string[] => {
    if (!text) return [];
  
    // 1. Chuyển về chữ thường, bỏ dấu cơ bản và tách từ
    const words = text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Bỏ dấu câu
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Lọc từ ngắn & stop-words
  
    // 2. Lấy các từ duy nhất
    const uniqueKeywords = Array.from(new Set(words));
  
    // 3. (Optional) Chỉ lấy tối đa 10 từ khóa quan trọng nhất
    return uniqueKeywords.slice(0, 10);
  };