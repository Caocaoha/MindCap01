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