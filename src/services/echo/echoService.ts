// src/services/echo/echoService.ts
import { db, EntityType } from '../../database/db';
import { extractKeywords } from './keywordExtractor';
import { ECHO_DEBOUNCE_MS, MAX_SAMPLE_SIZE } from './constants';

class EchoService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  // [ENTRY POINT]: Hàm gọi từ UI/Component
  public scheduleConnection(uuid: string, type: EntityType, content: string, parentId?: string) {
    // 1. Debounce Logic: Xóa timer cũ nếu có
    if (this.timers.has(uuid)) {
      clearTimeout(this.timers.get(uuid));
    }

    // 2. Thiết lập timer mới (4s)
    const timer = setTimeout(() => {
      this.runResonance(uuid, type, content, parentId);
      this.timers.delete(uuid);
    }, ECHO_DEBOUNCE_MS);

    this.timers.set(uuid, timer);
  }

  // [CORE LOGIC]: Thuật toán Cộng hưởng (Resonance)
  private async runResonance(uuid: string, type: EntityType, content: string, parentId?: string) {
    console.log(`[ECHO] Running resonance for: ${uuid}`);
    const keywords = extractKeywords(content);
    const linkedIds = new Set<string>();

    // LAYER 1: STRUCTURAL (Cấu trúc)
    if (parentId) linkedIds.add(parentId);

    // LAYER 2: TEMPORAL (Thời gian ±5 phút)
    // Query items created around NOW (chấp nhận sai số nhỏ vì logic chạy sau 4s)
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 mins
    
    // Helper function để query temporal (quét cả tasks và thoughts)
    const findTemporal = async (table: any) => {
      return await table
        .where('createdAt')
        .between(now - timeWindow, now + timeWindow)
        .filter((item: any) => item.uuid !== uuid) // Trừ chính nó
        .toArray();
    };

    const [tempTasks, tempThoughts] = await Promise.all([
      findTemporal(db.tasks),
      findTemporal(db.thoughts)
    ]);
    
    [...tempTasks, ...tempThoughts].forEach(item => linkedIds.add(item.uuid));

    // LAYER 3: SEMANTIC (Ngữ nghĩa)
    if (keywords.length >= 2) {
      // Helper function để query semantic với Sampling
      const findSemantic = async (table: any) => {
        // [PERFORMANCE] Sampling: Lấy 1000 items mới nhất
        const recentItems = await table.orderBy('createdAt').reverse().limit(MAX_SAMPLE_SIZE).toArray();
        
        return recentItems.filter((item: any) => {
           if (item.uuid === uuid) return false;
           // Intersection logic
           const overlap = item.tags?.filter((t: string) => keywords.includes(t));
           return overlap && overlap.length >= 2;
        });
      };

      const [semTasks, semThoughts] = await Promise.all([
        findSemantic(db.tasks),
        findSemantic(db.thoughts)
      ]);

      [...semTasks, ...semThoughts].forEach(item => linkedIds.add(item.uuid));
    }

    // [OUTPUT]: Cập nhật vào DB (Side Effect)
    const table = type === 'task' ? db.tasks : db.thoughts;
    
    await table.where('uuid').equals(uuid).modify({
      tags: keywords,
      linkedIds: Array.from(linkedIds),
      // updated_at không đổi để tránh trigger vòng lặp vô tận nếu có logic watch
    });

    console.log(`[ECHO] Connected ${uuid} to ${linkedIds.size} nodes.`);
    
    // TODO: Trigger CME Engine (CPI Score) ở đây
  }
}

export const echoService = new EchoService();