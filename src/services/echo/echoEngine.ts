// src/services/echo/echoEngine.ts
import { db } from '../../database/db';
import { extractKeywords } from '../../utils/keywordExtractor';

export class EchoEngine {
  /**
   * Cấp 2: Temporal Echo (Liên kết thời gian < 5 phút)
   */
  static async findTemporalLinks(currentId: string, createdAt: number): Promise<string[]> {
    const window = 5 * 60 * 1000; // 5 phút
    const startTime = createdAt - window;

    // Tìm trong cả tasks và thoughts
    const tasks = await db.tasks
      .where('createdAt').between(startTime, createdAt, false, false)
      .filter(t => t.id !== currentId)
      .toArray();

    const thoughts = await db.thoughts
      .where('createdAt').between(startTime, createdAt, false, false)
      .filter(t => t.id !== currentId)
      .toArray();

    return [...tasks, ...thoughts].map(e => e.id);
  }

  /**
   * Cấp 3: Semantic Echo (Liên kết ngữ nghĩa dựa trên từ khóa)
   */
  static async findSemanticLinks(currentId: string, keywords: string[]): Promise<string[]> {
    if (keywords.length === 0) return [];

    // Quét các entry trong vòng 90 ngày
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    
    // Lấy mẫu các entry gần đây (tối ưu hóa performance thay vì quét toàn bộ)
    const candidates = await db.tasks
      .where('createdAt').above(ninetyDaysAgo)
      .filter(t => t.id !== currentId)
      .toArray();
      
    const thoughts = await db.thoughts
      .where('createdAt').above(ninetyDaysAgo)
      .filter(t => t.id !== currentId)
      .toArray();

    const allCandidates = [...candidates, ...thoughts];
    const linkedIds: string[] = [];

    allCandidates.forEach(item => {
      // Đếm số từ khóa trùng lặp
      const intersection = keywords.filter(k => item.tags?.includes(k));
      
      // Điều kiện khớp: Trùng >= 2 từ khóa
      if (intersection.length >= 2) {
        linkedIds.push(item.id);
      }
    });

    return linkedIds;
  }
}