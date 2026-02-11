// src/features/echo/utils.ts

/**
 * NLP Lite: Trích xuất từ khóa từ một đoạn văn bản (loại bỏ từ dừng)
 */
export const extractKeywords = (text: string): string[] => {
    // Regex loại bỏ ký tự đặc biệt, chuyển về chữ thường
    const cleanText = text.toLowerCase().replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ');
    const words = cleanText.split(/\s+/);
    
    // Danh sách từ dừng (Stop words) cơ bản tiếng Việt - Hà có thể bổ sung thêm
    const stopWords = new Set(['là', 'của', 'và', 'với', 'trong', 'có', 'để', 'một', 'những']);
    
    // Chỉ lấy từ có độ dài > 2 và không nằm trong stopWords
    const keywords = words.filter(word => word.length > 2 && !stopWords.has(word));
    
    return Array.from(new Set(keywords)); // Loại bỏ trùng lặp
  };
  
  /**
   * Linking Logic: Kiểm tra xem hai entry có liên kết với nhau không
   */
  export const calculateLinkStrength = (entryA: any, entryB: any): number => {
    let score = 0;
  
    // 1. Temporal Link (±5 phút = 300,000ms)
    const timeDiff = Math.abs(entryA.createdAt - entryB.createdAt);
    if (timeDiff <= 300000) score += 1;
  
    // 2. Semantic Link (Trùng từ khóa)
    const commonKeywords = entryA.tags.filter((tag: string) => entryB.tags.includes(tag));
    if (commonKeywords.length > 0) score += 2;
  
    // 3. Structural Link (Cùng cha)
    if (entryA.parentId && entryA.parentId === entryB.parentId) score += 3;
  
    return score;
  };