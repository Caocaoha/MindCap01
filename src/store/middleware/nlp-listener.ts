import { useJourneyStore } from '../journey-store';
import { db } from '../../database/db';
import { nlpEngine } from '../../utils/nlp-engine';
import { reactiveEngine } from '../../services/echo/reactive-engine';
import type { ITask, IThought } from '../../database/types';

/**
 * [SHADOW LANE LISTENER]
 * Mục tiêu: Lắng nghe thay đổi trạng thái để kích hoạt xử lý NLP
 * mà không chặn luồng UI chính (Fast Lane).
 */
export const initializeNlpListener = () => {
  // Lắng nghe store: journey-store
  const unsubJourney = useJourneyStore.subscribe(
    (state: any, prevState: any) => {
      // 1. Phát hiện sự thay đổi: Tìm các item mới được thêm vào
      const newEntries = state.entries.filter(
        (entry: ITask | IThought) => !prevState.entries.find((e: any) => e.id === entry.id)
      );

      newEntries.forEach(async (entry: ITask | IThought) => {
        // Chỉ xử lý các record ở trạng thái "pending" (vừa được tạo từ Fast Lane)
        // Kiểm tra entry.id tồn tại để tránh lỗi TS
        if ((entry as any).status === 'pending' && entry.id) {
          await processShadowLane(entry);
        }
      });
    }
  );

  return () => {
    unsubJourney(); // Cleanup listener khi unmount
  };
};

/**
 * [PROCESS SHADOW LANE]
 * Quy trình xử lý ngầm: Pending -> Processing -> Success
 */
async function processShadowLane(entry: ITask | IThought) {
  // [FIX ERROR 4]: Guard clause - Nếu không có ID thì dừng ngay
  if (!entry.id) return;

  try {
    console.log(`[Shadow Lane] 🥷 Detected new entry: ${entry.id}`);

    // Xác định table cần update dựa trên loại entry
    // [FIX ERROR 1 & 2]: Kiểm tra thuộc tính để biết là Task hay Thought
    const isTask = 'title' in entry;
    const table = isTask ? db.tasks : db.thoughts;
    
    // Lấy text để xử lý NLP
    const textToProcess = isTask ? entry.title : (entry as IThought).content;

    // BƯỚC 1: Cập nhật trạng thái 'processing' (trong DB)
    await table.update(entry.id, { status: 'processing' } as any);

    // BƯỚC 2: Token Extraction (Trích xuất dữ liệu thô)
    const tokens = nlpEngine.extractTokens(textToProcess);

    // BƯỚC 3: Semantic Linking (Liên kết ngữ nghĩa)
    const linkedIds = await reactiveEngine.findSemanticLinks(tokens);

    // BƯỚC 4: Final Record & Commit (Ghi nhận kết quả cuối cùng)
    const updates = {
      status: 'success', // Hoàn tất
      tags: tokens.tags,
      scheduledFor: tokens.detectedDate, // [FIX ERROR 3]: Đổi date -> detectedDate (theo INlpResult)
      linkedTaskIds: linkedIds,   
      // processedAt: new Date() // Tạm bỏ nếu schema chưa có field này
    };

    // Update vào DB (Source of Truth)
    await table.update(entry.id, updates as any);

    // Update ngược lại vào Store (để UI phản hồi)
    useJourneyStore.getState().updateEntry(entry.id, updates as any);

    console.log(`[Shadow Lane] ✅ Processed entry ${entry.id} successfully.`);

  } catch (error) {
    console.error(`[Shadow Lane] 🚨 Error processing entry ${entry.id}:`, error);
    
    // Fallback: Nếu lỗi, trả về trạng thái 'pending' để retry sau (hoặc 'error')
    // Cần xác định lại table vì entry.id vẫn tồn tại
    const isTask = 'title' in entry;
    const table = isTask ? db.tasks : db.thoughts;
    await table.update(entry.id, { status: 'pending' } as any);
  }
}