/**
 * [ENGINE]: Bộ máy xử lý Regex tinh gọn để tách từ và xử lý ngôn ngữ
 */

export interface INlpResult {
  content: string;
  tokens: string[];
  tags: string[];
  intent?: string;
  sentiment?: number;
}

export const nlpEngine = {
  /**
   * Phân tích nội dung văn bản thô thành cấu trúc NLP
   */
  process: (text: string): INlpResult => {
    const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const tags = text.match(/#\w+/g) || [];
    
    return {
      content: text,
      tokens,
      tags: tags.map(tag => tag.replace('#', '')),
      intent: tokens.includes('cần') || tokens.includes('phải') ? 'action' : 'info'
    };
  }
};