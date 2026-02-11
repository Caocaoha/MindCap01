// src/services/echo/echoService.ts
import { db } from '../../database/db';
import { EchoEngine } from './echoEngine';
import { extractKeywords } from '../../utils/keywordExtractor';
import { useUserStore } from '../../store/userStore';

export class EchoService {
  /**
   * Hàm "Kết nối" chính - Chạy mỗi khi có Entry mới được tạo
   */
  static async connect(entityId: string, type: 'task' | 'thought') {
    const table = type === 'task' ? db.tasks : db.thoughts;
    const item = await table.get(entityId);
    
    if (!item) return;

    // 1. Trích xuất từ khóa và lưu vào tags (Indexing)
    const keywords = extractKeywords(item.content);
    
    // 2. Tìm liên kết thời gian (Cấp 2)
    const temporalLinks = await EchoEngine.findTemporalLinks(item.id, item.createdAt);
    
    // 3. Tìm liên kết ngữ nghĩa (Cấp 3)
    const semanticLinks = await EchoEngine.findSemanticLinks(item.id, keywords);

    // 4. Hợp nhất và loại bỏ trùng lặp
    const allLinks = Array.from(new Set([
      ...(item.linkedIds || []),
      ...temporalLinks,
      ...semanticLinks
    ]));

    // 5. Cập nhật ngược lại Database
    await table.update(entityId, {
      tags: keywords,
      linkedIds: allLinks
    });

    // 6. Trigger tính toán lại CPI (Cross-Pollination Index) trong Gamification
    // CPI = (Links_Explicit*3 + Links_Semantic*2 + Links_Temporal*1) / Total
    // Hàm này đã được quy hoạch trong SVC_CME
    console.log(`[ECHO] Connected ${entityId} with ${allLinks.length} nodes.`);
  }
}