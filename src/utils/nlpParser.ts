export interface ParsedInput {
    cleanContent: string;
    quantity?: number;
    unit?: string;
  }
  
  // Các đơn vị hỗ trợ: Thời gian, Khoảng cách, Số lượng
  const UNIT_REGEX = /(\d+)\s*(h|p|m|phút|giờ|km|kg|trang|lần|cái|steps)/i;
  
  export const parseInput = (rawText: string): ParsedInput => {
    if (!rawText) return { cleanContent: '' };
  
    const match = rawText.match(UNIT_REGEX);
  
    if (match) {
      // match[1] là số (30), match[2] là đơn vị (p)
      const quantity = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      // Xóa phần đã parse khỏi nội dung gốc để sạch sẽ
      // VD: "Chạy bộ 30p" -> "Chạy bộ"
      const cleanContent = rawText.replace(match[0], '').trim();
  
      return { cleanContent, quantity, unit };
    }
  
    return { cleanContent: rawText.trim() };
  };