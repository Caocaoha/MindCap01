// src/services/echo/reactive-engine.ts
import { db } from '../../database/db';
import type { INlpResult } from '../../utils/nlp-engine';

export const reactiveEngine = {
  /**
   * Tìm kiếm các Task/Thought có liên quan dựa trên Tokens
   * [cite: 20] Weights: Explicit (3), Contextual (2), Implicit (1)
   */
  findSemanticLinks: async (tokens: INlpResult): Promise<number[]> => {
    const linkedIds = new Set<number>();

    // 1. Tìm theo Tags (Explicit Context - Weight High)
    if (tokens.tags.length > 0) {
      const tagMatches = await db.tasks
        .where('tags')
        .anyOf(tokens.tags)
        .primaryKeys(); // Chỉ lấy ID để tối ưu
      
      tagMatches.forEach(id => linkedIds.add(id));
    }

    // 2. Tìm theo Keywords trong title (Implicit Context - Weight Low)
    // Logic đơn giản: Tìm các task có chứa từ khóa quan trọng
    // (Bỏ qua các từ stop-words nếu cần, ở đây tìm exact match cho MVP)
    if (tokens.cleanText.length > 5) {
       // Demo: Tìm các task có title chứa một phần text (cần tối ưu sau)
       const keywords = tokens.cleanText.split(' ').filter(w => w.length > 4);
       
       if (keywords.length > 0) {
         // Lưu ý: Dexie collection filter hơi chậm nếu DB lớn, cần Index
         // Ở đây dùng filter JS cho MVP local-first
         const textMatches = await db.tasks
            .filter(task => keywords.some(k => task.title.includes(k)))
            .primaryKeys();
            
         textMatches.forEach(id => linkedIds.add(id));
       }
    }

    return Array.from(linkedIds);
  }
};