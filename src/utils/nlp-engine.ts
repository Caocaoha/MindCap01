// src/utils/nlp-engine.ts

export interface INlpResult {
  tokens: string[];
  tags: string[];
  mentions: string[];
  detectedDate?: Date;
  // [NEW] Fields
  quantity?: number;
  unit?: string;
  cleanContent: string;
}

export const nlpEngine = {
  extractTokens: (text: string): INlpResult => {
    const tags = (text.match(/#[\w-]+/g) || []).map(t => t.slice(1));
    const mentions = (text.match(/@[\w-]+/g) || []).map(m => m.slice(1));
    
    // [NEW] Regex bắt Quantity & Unit (Ví dụ: 30p, 2h, 15 mins)
    // Support: p, m, min, h, hour
    const qtyRegex = /\b(\d+)\s*(p|m|min|mins|h|hour|hours)\b/i;
    const qtyMatch = text.match(qtyRegex);
    
    let quantity: number | undefined;
    let unit: string | undefined;
    let cleanContent = text;

    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      unit = qtyMatch[2];
      // Xóa phần qty khỏi content để sạch
      cleanContent = text.replace(qtyRegex, '').trim(); 
    }

    // Xóa tags/mentions khỏi cleanContent
    cleanContent = cleanContent.replace(/#[\w-]+/g, '').replace(/@[\w-]+/g, '').trim();

    return {
      tokens: text.split(/\s+/),
      tags,
      mentions,
      quantity,
      unit,
      cleanContent
    };
  }
};