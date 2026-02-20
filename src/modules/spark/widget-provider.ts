import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';

/**
 * [SERVICE]: Widget Memory Provider (v2.2).
 * Thực thi cơ chế Pooling và chuẩn bị Timeline cho Widget Memory Spark V2.0.
 * [FIX]: Xử lý lỗi TS2345 bằng Type Guard cho thuộc tính 'id'.
 * Tuân thủ triết lý Zero-Computation on Widget. 
 */

const POOL_LIMITS = {
  HERITAGE: 50,
  UNIVERSE: 100,
  TRENDING: 50,
  ISOLATED: 50
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const WidgetProvider = {
  /**
   * [CANDIDATE POOLING]: Phân loại toàn bộ dữ liệu vào 4 hồ chứa. 
   * Tác vụ này chạy ngầm để chuẩn bị dữ liệu tĩnh cho Widget.
   */
  async generateCandidatePools() {
    const now = Date.now();
    const tenDaysAgo = now - (10 * MS_PER_DAY);

    // Lấy toàn bộ dữ liệu cần thiết (Tasks & Thoughts)
    const allTasks = await db.tasks.toArray();
    const allThoughts = await db.thoughts.toArray();
    const allEntries = [...allTasks, ...allThoughts];

    /**
     * Pool 1 (Heritage): > 10 ngày AND isBookmarked = true.
     * Sắp xếp theo echoLinkCount DESC.
     */
    const pool1 = allEntries
      .filter(e => e.createdAt <= tenDaysAgo && e.isBookmarked)
      .sort((a, b) => (b.echoLinkCount || 0) - (a.echoLinkCount || 0))
      .slice(0, POOL_LIMITS.HERITAGE);

    /**
     * Pool 2 (Universe): isBookmarked = true.
     * Sắp xếp ngẫu nhiên (Shuffle).
     */
    const pool2 = allEntries
      .filter(e => e.isBookmarked)
      .sort(() => Math.random() - 0.5)
      .slice(0, POOL_LIMITS.UNIVERSE);

    /**
     * Pool 3 (Trending New): <= 10 ngày AND echoLinkCount > 0.
     * Sắp xếp theo interactionScore DESC.
     */
    const pool3 = allEntries
      .filter(e => e.createdAt > tenDaysAgo && (e.echoLinkCount || 0) > 0)
      .sort((a, b) => (b.interactionScore || 0) - (a.interactionScore || 0))
      .slice(0, POOL_LIMITS.TRENDING);

    /**
     * Pool 4 (Isolated New): <= 10 ngày AND echoLinkCount = 0.
     * Sắp xếp ngẫu nhiên.
     */
    const pool4 = allEntries
      .filter(e => e.createdAt > tenDaysAgo && (e.echoLinkCount || 0) === 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, POOL_LIMITS.ISOLATED);

    return { pool1, pool2, pool3, pool4 };
  },

  /**
   * [TIMELINE PROVIDER]: Chuẩn bị 8 mốc hiển thị cho 24h tới.
   * [LOGIC]: Đảm bảo tính duy nhất của ID trong mỗi snapshot.
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

      /**
       * [UNIQUENESS GUARD]: Khởi tạo tập hợp ID đã chọn cho mốc hiện tại.
       */
      const selectedIds = new Set<number>();

      /**
       * Hàm hỗ trợ lấy bản ghi không trùng lặp từ Pool bằng cách tăng offset.
       * [FIX]: Bổ sung kiểm tra typeof 'number' để thỏa mãn TypeScript compiler.
       */
      const getUniqueItem = (pool: any[], pointer: number) => {
        if (pool.length === 0) return null;
        let offset = 0;
        let item = pool[(pointer + offset) % pool.length];
        
        // TypeScript Type Guard: Chỉ thực hiện kiểm tra nếu ID là kiểu number hợp lệ
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

      // 1. Slot 1 (Heritage)
      const s1 = getUniqueItem(pool1, currentPointer);

      // 2. Slot 3 (Trending)
      const s3 = getUniqueItem(pool3, currentPointer);

      // 3. Slot 4 (Isolated)
      const s4 = getUniqueItem(pool4, currentPointer);

      // 4. Slot 2 (Universe) - Ngẫu nhiên và phải duy nhất trong cụm 4 thẻ
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
   * [MANUAL REFRESH]: Ép tăng con trỏ và phát tín hiệu cập nhật UI tức thì.
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