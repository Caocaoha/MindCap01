// src/types/index.ts

export interface Task {
    id?: number;
    title: string;
    status: 'active' | 'completed' | 'archived';
    quantity: number;   // Mục tiêu (ví dụ: 10 trang sách, 2 lít nước)
    progress: number;   // Hiện tại
    isFocusing: number; // 1: Đang trong Focus Mode, 0: Normal
    createdAt: Date;
  }
  export interface MemorySparkFields {
    reviewStage: number;    // Giai đoạn hiện tại (0: New, 1: R1, ..., 5: R5)
    nextReviewAt?: number;  // Timestamp của lần Spark tiếp theo
    wordCount: number;      // Đếm từ để kích hoạt luồng New (>16 từ)
  }
  
  // Bảng Tasks/Thoughts sẽ kế thừa thêm interface này
  export interface MemoryRecord extends BaseEntity, MemorySparkFields {}