import { db } from '../../database/db';
import { ITask } from '../../database/types';
import { INlpResult } from '../../utils/nlp-engine'; // [FIX]: Đã có member export

/**
 * [SVC_ECHO]: Hệ thống trích xuất từ khóa và liên kết ngữ nghĩa
 */
export const reactiveEngine = {
  /**
   * Lắng nghe tín hiệu từ NLP để tìm kiếm các liên kết dữ liệu liên quan
   */
  findConnections: async (nlpResult: INlpResult): Promise<ITask[]> => {
    const { tokens, tags } = nlpResult;
    const allTasks = await db.tasks.toArray();

    // Tìm kiếm các task có chứa token hoặc tag tương ứng
    return allTasks.filter((task: ITask) => {
      // [FIX]: Gán kiểu string cho tham số 'w' để tránh lỗi TS7006
      const hasToken = tokens.some((w: string) => 
        task.content.toLowerCase().includes(w)
      );

      // [FIX]: Gán kiểu string cho tham số 'k' để tránh lỗi TS7006
      const hasTag = tags.some((k: string) => 
        task.tags?.includes(k)
      );

      return hasToken || hasTag;
    });
  },

  /**
   * Tự động tạo liên kết dựa trên nội dung (Context Link logic)
   */
  processAutoLink: async (content: string) => {
    // Logic xử lý liên kết tự động sẽ được triển khai tại đây
    console.log("Processing auto-link for:", content);
  }
};