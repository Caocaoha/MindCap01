import { db } from '../../database/db';
import { ITask, IThought } from '../../database/types';

/**
 * [SERVICE]: Widget Memory Provider.
 * Thực thi cơ chế Pooling và chuẩn bị Timeline cho Widget Memory Spark V2.0.
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
   * Mỗi mốc cách nhau 3 giờ.
   */
  async GetWidgetTimeline() {
    const { pool1, pool2, pool3, pool4 } = await this.generateCandidatePools();
    
    // Lấy con trỏ Current_Pointer từ LocalStorage (mặc định 0)
    let currentPointer = parseInt(localStorage.getItem('spark_widget_pointer') || '0', 10);
    
    const timeline = [];
    const startTime = Date.now();

    // Tạo 8 mốc thời gian (mỗi mốc 3 giờ)
    for (let i = 0; i < 8; i++) {
      const triggerAt = startTime + (i * 3 * 60 * 60 * 1000);
      const hour = new Date(triggerAt).getHours();

      // [SLEEP MODE]: Ngừng gửi mốc mới từ 23:00 - 06:00 
      if (hour >= 23 || hour < 6) continue;

      /**
       * Đóng gói 4 Slot cho mỗi mốc thời gian. 
       * Sử dụng Current_Pointer để xoay vòng không trùng lặp.
       */
      const snapshot = {
        triggerAt,
        slots: {
          slot1: pool1[currentPointer % (pool1.length || 1)],
          slot2: pool2[Math.floor(Math.random() * (pool2.length || 1))], // Random từ Universe
          slot3: pool3[currentPointer % (pool3.length || 1)],
          slot4: pool4[currentPointer % (pool4.length || 1)]
        }
      };

      timeline.push(snapshot);
      currentPointer++; // Tăng con trỏ sau mỗi Slot
    }

    // Lưu lại con trỏ mới cho lần chạy sau
    localStorage.setItem('spark_widget_pointer', currentPointer.toString());

    /**
     * TRẢ VỀ DỮ LIỆU TĨNH: Widget chỉ việc đọc và hiển thị.
     */
    return timeline;
  },

  /**
   * [NEW]: MANUAL REFRESH LOGIC (Blueprint v2.0).
   * Cưỡng bức làm mới dữ liệu Widget bằng cách tăng con trỏ và tính toán lại mốc hiện tại.
   */
  async manualRefresh() {
    try {
      // 1. Đọc và ép tăng con trỏ hiện tại lên +1
      let currentPointer = parseInt(localStorage.getItem('spark_widget_pointer') || '0', 10);
      currentPointer++;
      
      // 2. Lưu lại Pointer mới ngay lập tức
      localStorage.setItem('spark_widget_pointer', currentPointer.toString());

      // 3. Tạo lại Timeline mới bắt đầu từ Pointer này
      const newTimeline = await this.GetWidgetTimeline();

      /**
       * 4. PHÁT TÍN HIỆU CẬP NHẬT: Gửi snapshot đầu tiên (hiện tại) 
       * để UI đồng bộ hóa tức thì.
       */
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

  /**
   * [NEW]: Khởi tạo trình lắng nghe sự kiện từ giao diện (widget-memory-spark.tsx).
   */
  init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('spark:manual-refresh', () => {
        this.manualRefresh();
      });
    }
  }
};

// Tự động kích hoạt bộ lắng nghe khi Service được nạp vào hệ thống
WidgetProvider.init();