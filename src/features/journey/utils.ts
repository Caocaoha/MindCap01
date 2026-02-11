// src/features/journey/utils.ts

interface EntropyParams {
    createdAt: number;
    isBookmarked: boolean;
    linkedIds: string[];
  }
  
  /**
   * Tính toán độ mờ (Opacity) dựa trên thời gian và giáp liên kết (ECHO)
   */
  export const calculateOpacity = ({ 
    createdAt, 
    isBookmarked, 
    linkedIds 
  }: EntropyParams): number => {
    // 1. Nếu là Hạt giống (Bookmark), sáng vĩnh viễn
    if (isBookmarked) return 1.0;
  
    // 2. Tính số ngày đã trôi qua (Time Decay)
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysPassed = Math.floor((Date.now() - createdAt) / msPerDay);
    
    const decay = daysPassed * 0.01; // 1% mỗi ngày
    
    // 3. Tính giáp bảo vệ từ liên kết (Link Shield)
    const shield = (linkedIds?.length || 0) * 0.05; // 5% mỗi liên kết
  
    // 4. Tổng hợp và áp dụng giới hạn [0.2 - 1.0]
    const finalOpacity = (1.0 - decay) + shield;
  
    return Math.max(0.2, Math.min(1.0, finalOpacity));
  };