// 1. Cấu trúc một lần trả lời
interface IIdentityEntry {
    id: string;        // uuid
    content: string;   // Nội dung trả lời
    createdAt: number; // Timestamp
    context?: string;  // (Optional) Trả lời trong hoàn cảnh nào (vd: 'yearly_review', 'crisis')
  }
  
  // 2. Cấu trúc State tổng thể
  interface IIdentityState {
    // ... các cờ trạng thái cũ (isCooldown, currentQuestionIndex...)
  
    // Thay vì lưu 1 giá trị, ta lưu Dictionary chứa mảng lịch sử
    // Key = Question ID (1-25)
    logs: Record<number, IIdentityEntry[]>;
  
    // Cache nhanh giá trị mới nhất để hiển thị ở Tab 2 Lớp 1 (đỡ phải query mảng)
    latestAnswers: Record<number, IIdentityEntry>;
    
    // Cache cho Tab 1 (Manifesto)
    manifesto: {
      q19: string; // Fear
      q20: string; // Vision
      // ...
    };
  }