// src/features/echo/EchoEngine.ts
import { db } from '../../core/db';
import { extractKeywords } from './KeywordExtractor';

export class EchoEngine {
  static async findSemanticLinks(entryId: string, content: string) {
    const currentKeywords = extractKeywords(content);
    if (currentKeywords.length === 0) return [];

    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);

    // 1. Quét 60 ngày gần nhất qua Index 'tags'
    const recentMatches = await db.tasks.where('tags')
      .anyOf(currentKeywords)
      .filter(item => item.createdAt >= sixtyDaysAgo && item.id !== entryId)
      .toArray();

    // 2. Quét dữ liệu cũ (Chỉ lấy Bookmark hoặc Entropy cao)
    // Giả định Entropy cao là > 0.7 (theo snapshot v1.3)
    const deepMatches = await db.tasks.where('tags')
      .anyOf(currentKeywords)
      .filter(item => 
        item.createdAt < sixtyDaysAgo && 
        (item.isBookmarked || (item.entropy || 0) > 0.7) &&
        item.id !== entryId
      )
      .toArray();

    // 3. Scoring (Resonance)
    const allMatches = [...recentMatches, ...deepMatches];
    const linkedIds = allMatches
      .filter(match => {
        const intersection = currentKeywords.filter(k => match.tags.includes(k));
        return intersection.length >= 2; // Điều kiện khớp: ít nhất 2 từ khóa trùng
      })
      .map(match => match.id);

    return Array.from(new Set(linkedIds));
  }
}