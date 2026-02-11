import { db, BaseEntity } from '../../database/db';
import { extractKeywords } from '../../utils/keywordExtractor';

const TEMPORAL_WINDOW = 5 * 60 * 1000; // 5 phút
const DEBOUNCE_TIME = 4000; // 4 giây

class EchoService {
  private pendingIds: Set<string> = new Set();
  private timer: any = null;

  // Gọi hàm này khi có Task/Thought mới
  scheduleScan(uuid: string) {
    this.pendingIds.add(uuid);
    
    // Reset timer (Debounce)
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.processQueue(), DEBOUNCE_TIME);
  }

  private async processQueue() {
    const idsToScan = Array.from(this.pendingIds);
    this.pendingIds.clear();

    console.log(`[ECHO] Scanning resonance for ${idsToScan.length} items...`);

    for (const id of idsToScan) {
      await this.findResonance(id);
    }
  }

  private async findResonance(targetId: string) {
    // 1. Lấy bản ghi gốc
    const target = await db.tasks.get({ uuid: targetId }) || await db.thoughts.get({ uuid: targetId });
    if (!target) return;

    const keywords = extractKeywords(target.content);
    const relatedIds: Set<string> = new Set(target.linkedIds || []);

    // 2. Quét toàn bộ DB (Trong thực tế sẽ dùng Index để tối ưu)
    // Ở đây demo quét 100 item gần nhất để tìm Temporal & Semantic
    const recentItems = [
      ...(await db.tasks.orderBy('createdAt').reverse().limit(100).toArray()),
      ...(await db.thoughts.orderBy('createdAt').reverse().limit(100).toArray())
    ];

    for (const item of recentItems) {
      if (item.uuid === target.uuid) continue; // Bỏ qua chính nó

      let score = 0;

      // --- LAYER 1: STRUCTURAL (Parent) ---
      if (target.parentId === item.uuid || item.parentId === target.uuid) {
        score += 100; // Hard link
      }

      // --- LAYER 2: TEMPORAL (±5 mins) ---
      const timeDiff = Math.abs(target.createdAt - item.createdAt);
      if (timeDiff <= TEMPORAL_WINDOW) {
        score += 50; // Soft link
      }

      // --- LAYER 3: SEMANTIC (Keyword Overlap) ---
      const itemKeywords = extractKeywords(item.content);
      const overlap = keywords.filter(k => itemKeywords.includes(k));
      if (overlap.length >= 2) { // Trùng ít nhất 2 từ khóa
        score += 20 * overlap.length;
      }

      // KẾT LUẬN: Nếu đủ mạnh thì liên kết
      if (score >= 40) { // Ngưỡng tối thiểu
        relatedIds.add(item.uuid);
        
        // Link 2 chiều (Backlink)
        if (!item.linkedIds.includes(target.uuid)) {
            await this.updateLinks(item, target.uuid);
        }
      }
    }

    // Cập nhật Target nếu có link mới
    if (relatedIds.size > (target.linkedIds?.length || 0)) {
        await this.updateLinks(target, ...Array.from(relatedIds));
        console.log(`[ECHO] Linked ${target.content} <--> ${relatedIds.size} items`);
    }
  }

  // Helper cập nhật DB an toàn
  private async updateLinks(item: any, ...newLinks: string[]) {
    const table = item.type === 'task' ? db.tasks : db.thoughts;
    const uniqueLinks = Array.from(new Set([...(item.linkedIds || []), ...newLinks]));
    await table.update(item.id, { linkedIds: uniqueLinks });
  }
}

export const echoService = new EchoService();