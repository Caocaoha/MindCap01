// src/store/middleware/nlp-listener.ts
import { analyze } from '../../utils/nlp-engine';
import { db } from '../../database/db';

/**
 * [STATE VARIABLES]: Quản lý bộ nhớ đệm cho Shadow Sync.
 * lastProcessedContent: Dùng để thực hiện cơ chế Diffing (Trí tuệ "Chỉ nhìn vào cái mới").
 * debounceTimer: Quản lý chiến lược Debouncing để tránh quá tải CPU khi gõ phím nhanh.
 */
let lastProcessedContent: string = '';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * [TRÁI TIM]: nlpListener - Middleware lắng nghe và kích hoạt xử lý NLP ngầm.
 * Giai đoạn 6.12: Triển khai Shadow Lane (Phase 2) với Debouncing và Diffing.
 * [NUCLEAR FIX]: Ép kiểu 'any' để bảo tồn logic thực thi mà không bị chặn bởi TypeScript Overload.
 */
export const nlpListener = (f: any, name?: string): any => (set: any, get: any, store: any) => {
  
  /**
   * Intercept hàm set: Lắng nghe mọi thay đổi trạng thái trong Zustand.
   */
  const newSet = (...args: any[]) => {
    // 1. Pass-through logic: Thực hiện cập nhật trạng thái UI ngay lập tức (Fast-lane).
    set(...args);
    
    // 2. SHADOW LANE LOGIC: Phân tích ngôn ngữ tự nhiên ngầm.
    const state = get();
    
    /**
     * CHỈ KÍCH HOẠT KHI CÓ THAY ĐỔI Ở SEARCHQUERY (Vùng nhập liệu chính).
     * searchQuery là nơi chứa nội dung thô từ InputBar.
     */
    if (state.searchQuery !== undefined && state.searchQuery !== null) {
      const currentContent = state.searchQuery.trim();

      // CHIẾN LƯỢC 1: DIFFING - Chỉ xử lý nếu nội dung thực sự thay đổi so với lần trước.
      if (currentContent === lastProcessedContent) {
        return;
      }

      // CHIẾN LƯỢC 2: DEBOUNCING - Trì hoãn 500ms sau khi người dùng ngừng gõ.
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        if (!currentContent) {
          lastProcessedContent = '';
          return;
        }

        // Cập nhật mốc so sánh cho lần Diffing tiếp theo.
        lastProcessedContent = currentContent;

        /**
         * [PHASE 2_SHADOW_SYNC]: Bắt đầu tiến trình bóc tách thực thể ngầm.
         * Bước A: Gọi bộ máy nlp-engine để phân tích.
         */
        const nlpResult = analyze(currentContent);

        /**
         * Bước B: Semantic Linking (Echo Engine).
         * Nếu tìm thấy thực thể định lượng, chuẩn bị cập nhật Database ngầm.
         * terminal_action: Ghi dữ liệu cuối cùng vào database/db.ts.
         */
        if (nlpResult.quantity || nlpResult.tags.length > 0) {
          // Placeholder cho việc tự động gợi ý liên kết hoặc điền Form dựa trên kết quả NLP.
          if (name) {
            console.log(`[NLP_SHADOW_SYNC] Entity Detected in ${name}:`, {
              content: nlpResult.content,
              quantity: nlpResult.quantity,
              unit: nlpResult.unit,
              tags: nlpResult.tags
            });
          }
        }
      }, 500); // 500ms trì hoãn thông minh theo yêu cầu.
    }
  };

  return f(newSet, get, store);
};