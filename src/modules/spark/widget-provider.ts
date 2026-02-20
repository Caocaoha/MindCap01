import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';

/**
 * [SERVICE]: Widget Memory Provider (v2.4).
 * Thực thi cơ chế Pooling và chuẩn bị Timeline cho Widget Memory Spark V2.0.
 * [FIX]: Khớp cấu trúc Content Seeds với interface IThought (wordCount, recordStatus).
 * Tuân thủ triết lý Zero-Computation on Widget. 
 */

const POOL_LIMITS = {
  HERITAGE: 50,
  UNIVERSE: 100,
  TRENDING: 50,
  ISOLATED: 50
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Danh sách hạt giống nội dung khởi tạo
const CONTENT_SEEDS = [
  "Hãy bắt đầu với mục tiêu rất nhỏ và dễ dàng.",
  "Hãy tăng mục tiêu với bước tăng rất nhỏ.",
  "Sắp xếp lại môi trường sống cho thuận lợi là cách tốt nhất để giúp thói quen được diễn ra.",
  "Nên gắn thói quen mới vào sau 1 thói quen cũ.",
  "Hãy làm việc quan trọng vào đầu ngày, khi bạn khỏe mạnh, sáng suốt nhất.",
  "Hãy bật 2 phím Khẩn cấp và Quan trọng để lọc việc cần làm.",
  "Việc Quan trọng mới định hình cuộc đời bạn, việc Khẩn cấp thường làm bạn sao lãng.",
  "Tôi đang làm những việc này để lẩn tránh điều gì?",
  "Tôi đang hướng đến cuộc sống mà tôi ghê sợ hay cuộc sống tôi ao ước?",
  "Điều tôi đang làm là để bảo vệ cái tôi hiện tại hay là trở thành con người tôi ao ước?",
  "Điều gì rất quan trọng với tôi mà tôi đang giả vờ không quan tâm đến?",
  "Tôi có thể thay đổi môi trường thế nào để có hành vi mong muốn?"
];

export const WidgetProvider = {
  /**
   * [CANDIDATE POOLING]: Phân loại toàn bộ dữ liệu vào 4 hồ chứa. 
   */
  async generateCandidatePools() {
    const now = Date.now();
    const tenDaysAgo = now - (10 * MS_PER_DAY);

    // 1. Lấy dữ liệu từ Database
    const allTasks = await db.tasks.toArray();
    const allThoughts = await db.thoughts.toArray();

    /**
     * [RULE 1]: Lọc Task > 16 từ.
     */
    const validTasks = allTasks.filter(t => {
      const wordCount = (t.content || "").trim().split(/\s+/).length;
      return wordCount > 16;
    });

    const allEntries: (ITask | IThought)[] = [...validTasks, ...allThoughts];

    /**
     * Phân bổ Pools dựa trên tiêu chí Blueprint v2.0.
     */
    const pool1 = allEntries
      .filter(e => e.createdAt <= tenDaysAgo && e.isBookmarked)
      .sort((a, b) => (b.echoLinkCount || 0) - (a.echoLinkCount || 0))
      .slice(0, POOL_LIMITS.HERITAGE);

    const pool2 = allEntries
      .filter(e => e.isBookmarked)
      .sort(() => Math.random() - 0.5)
      .slice(0, POOL_LIMITS.UNIVERSE);

    const pool3 = allEntries
      .filter(e => e.createdAt > tenDaysAgo && (e.echoLinkCount || 0) > 0)
      .sort((a, b) => (b.interactionScore || 0) - (a.interactionScore || 0))
      .slice(0, POOL_LIMITS.TRENDING);

    const pool4 = allEntries
      .filter(e => e.createdAt > tenDaysAgo && (e.echoLinkCount || 0) === 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, POOL_LIMITS.ISOLATED);

    /**
     * [RULE 2]: Bơm Content Seeds nếu tổng lượng bản ghi thực tế < 40.
     */
    const totalRecords = pool1.length + pool2.length + pool3.length + pool4.length;

    if (totalRecords < 40) {
      /**
       * [FIX]: Tạo đối tượng Seed khớp 100% với IThought để tránh lỗi TS2345.
       */
      const seeds: IThought[] = CONTENT_SEEDS.map((content, index) => ({
        id: -(index + 1),
        content,
        type: 'thought' as const,
        wordCount: content.trim().split(/\s+/).length, // Bổ sung wordCount
        recordStatus: 'success' as const,              // Bổ sung recordStatus
        createdAt: now,
        updatedAt: now,
        isBookmarked: true,
        echoLinkCount: 0,
        interactionScore: 0,
        syncStatus: 'synced' as const
      }));

      // Bơm vào các hồ chứa ngẫu nhiên/cô lập
      pool2.push(...seeds);
      pool4.push(...seeds);
    }

    return { pool1, pool2, pool3, pool4 };
  },

  /**
   * [TIMELINE PROVIDER]: Chuẩn bị 8 mốc hiển thị cho 24h tới.
   */
  async GetWidgetTimeline() {
    const { pool1, pool2, pool3, pool4 } = await this.generateCandidatePools();
    
    let currentPointer = parseInt(localStorage.getItem('spark_widget_pointer') || '0', 10);
    const timeline = [];
    const startTime = Date.now();

    for (let i = 0; i < 8; i++) {
      const triggerAt = startTime + (i * 3 * 60 * 60 * 1000);
      const hour = new Date(triggerAt).getHours();

      if (hour >= 23 || hour < 6) continue;

      const selectedIds = new Set<number>();

      /**
       * Lấy bản ghi không trùng lặp và kiểm tra kiểu dữ liệu an toàn.
       */
      const getUniqueItem = (pool: any[], pointer: number) => {
        if (pool.length === 0) return null;
        let offset = 0;
        let item = pool[(pointer + offset) % pool.length];
        
        while (
          item && 
          typeof item.id === 'number' && 
          selectedIds.has(item.id) && 
          offset < 10 && 
          offset < pool.length
        ) {
          offset++;
          item = pool[(pointer + offset) % pool.length];
        }
        
        if (item && typeof item.id === 'number') {
          selectedIds.add(item.id);
          return item;
        }
        return null;
      };

      const s1 = getUniqueItem(pool1, currentPointer);
      const s3 = getUniqueItem(pool3, currentPointer);
      const s4 = getUniqueItem(pool4, currentPointer);

      let s2 = null;
      if (pool2.length > 0) {
        let attempts = 0;
        let tempItem = null;
        do {
          tempItem = pool2[Math.floor(Math.random() * pool2.length)];
          attempts++;
        } while (
          tempItem && 
          typeof tempItem.id === 'number' && 
          selectedIds.has(tempItem.id) && 
          attempts < 15
        );
        
        if (tempItem && typeof tempItem.id === 'number') {
          selectedIds.add(tempItem.id);
          s2 = tempItem;
        }
      }

      const snapshot = {
        triggerAt,
        slots: {
          slot1: s1,
          slot2: s2,
          slot3: s3,
          slot4: s4
        }
      };

      timeline.push(snapshot);
      currentPointer++; 
    }

    localStorage.setItem('spark_widget_pointer', currentPointer.toString());
    return timeline;
  },

  /**
   * [MANUAL REFRESH]: Làm mới thủ công.
   */
  async manualRefresh() {
    try {
      let currentPointer = parseInt(localStorage.getItem('spark_widget_pointer') || '0', 10);
      currentPointer++;
      localStorage.setItem('spark_widget_pointer', currentPointer.toString());

      const newTimeline = await this.GetWidgetTimeline();

      if (newTimeline.length > 0) {
        window.dispatchEvent(new CustomEvent('spark:data-updated', { 
          detail: newTimeline[0] 
        }));
      }

      return newTimeline;
    } catch (error) {
      console.error("[WidgetProvider] Manual Refresh Failed:", error);
    }
  },

  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('spark:manual-refresh', () => {
        this.manualRefresh();
      });
    }
  }
};

WidgetProvider.init();