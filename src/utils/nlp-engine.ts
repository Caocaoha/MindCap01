// src/utils/nlp-engine.ts

export interface INlpResult {
    tags: string[];
    mentions: string[];
    cleanText: string;
    detectedDate?: Date; // Dành cho tương lai
  }
  
  export const nlpEngine = {
    /**
     * Phân tích văn bản để tách Tags (#) và Mentions (@)
     * Input: "Học React #coding @saban"
     * Output: { tags: ['coding'], mentions: ['saban'], cleanText: "Học React" }
     */
    extractTokens: (text: string): INlpResult => {
      if (!text) return { tags: [], mentions: [], cleanText: "" };
  
      // Regex patterns
      const tagRegex = /#[\w\u00C0-\u00FF-]+/g; // Hỗ trợ tiếng Việt và dấu gạch ngang
      const mentionRegex = /@[\w\u00C0-\u00FF-]+/g;
  
      // Extract
      const tags = (text.match(tagRegex) || []).map(t => t.substring(1)); // Bỏ dấu #
      const mentions = (text.match(mentionRegex) || []).map(m => m.substring(1)); // Bỏ dấu @
  
      // Clean text (loại bỏ tags/mentions khỏi nội dung hiển thị chính nếu cần)
      // Hiện tại giữ nguyên text gốc hoặc tùy logic hiển thị, ở đây ta trả về text gốc
      // để UI tự xử lý highlight.
      
      return {
        tags,
        mentions,
        cleanText: text.trim()
      };
    },
  
    /**
     * Tính độ sâu văn bản (Text Depth) cho thuật toán Leveling
     * [cite: 20] Condition: "Word count > 40" -> Deep Note
     */
    calculateTextDepth: (text: string): number => {
      if (!text) return 0;
      return text.trim().split(/\s+/).length;
    }
  };