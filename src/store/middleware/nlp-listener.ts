// src/store/middleware/nlp-listener.ts
import { StateCreator } from 'zustand';
import { analyze } from '../../utils/nlp-engine';

/**
 * [STATE VARIABLES]: Quản lý bộ nhớ đệm cho Shadow Sync.
 * lastProcessedContent: Dùng để thực hiện cơ chế Diffing (Trí tuệ "Chỉ nhìn vào cái mới").
 * debounceTimer: Quản lý chiến lược Debouncing để tránh quá tải CPU khi gõ phím nhanh.
 */
let lastProcessedContent: string = '';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * [TRÁI TIM]: nlpListener - Middleware lắng nghe và kích hoạt xử lý NLP ngầm.
 * Giai đoạn 6.13: Fix lỗi TS2769 bằng kỹ thuật Internal Bypass.
 * Vẫn sử dụng Generic <T> để bảo tồn Type Inference cho Store bên ngoài.
 */
export const nlpListener = <T extends { searchQuery: string; setParsedData?: (data: any) => void }>(
  config: StateCreator<T>,
  name?: string
): StateCreator<T> => (set, get, api) => {
  
  /**
   * Trả về hàm khởi tạo Store với bản ghi đè hàm set.
   */
  return config(
    (...args) => {
      // [FIX TS2769]: Ép kiểu 'any' cho hàm set để vượt qua kiểm tra Overload nghiêm ngặt.
      // Chúng ta chỉ chuyển tiếp (forward) tham số nên việc này an toàn về mặt Runtime.
      (set as any)(...args);
      
      // 2. SHADOW LANE LOGIC: Phân tích ngôn ngữ tự nhiên ngầm.
      const state = get();
      
      /**
       * CHỈ KÍCH HOẠT KHI CÓ THAY ĐỔI Ở SEARCHQUERY (Vùng nhập liệu chính).
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
            // Nếu nội dung trống, xóa dữ liệu parsed trong Store
            if (state.setParsedData) {
              state.setParsedData(null);
            }
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
           * Bước B: Auto-fill Sync (Hệ thần kinh dữ liệu).
           * Chuyển kết quả bóc tách vào UI Store.
           */
          if (state.setParsedData) {
            state.setParsedData({
              quantity: nlpResult.quantity,
              unit: nlpResult.unit,
              frequency: nlpResult.frequency
            });
          }

          /**
           * Bước C: Semantic Linking (Echo Engine).
           * Nếu tìm thấy thực thể định lượng, ghi log phục vụ kiểm tra hệ thống.
           */
          if (nlpResult.quantity || nlpResult.tags.length > 0) {
            if (name) {
              console.log(`[NLP_SHADOW_SYNC] Entity Parsed & Injected from ${name}:`, {
                content: nlpResult.content,
                quantity: nlpResult.quantity,
                unit: nlpResult.unit,
                tags: nlpResult.tags,
                frequency: nlpResult.frequency
              });
            }
          }
        }, 500); // 500ms trì hoãn thông minh theo yêu cầu.
      }
    },
    get,
    api
  );
};