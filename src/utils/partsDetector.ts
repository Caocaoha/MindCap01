// Định nghĩa các mẫu nhận diện (Patterns)
const PATTERNS = {
    MANAGER: /\b(phải|cần|nên|kế hoạch|mục tiêu|trễ|sai|đúng|hoàn hảo|kiểm soát|deadline|xong|báo cáo)\b/i,
    FIREFIGHTERS: /\b(mệt|kệ|bỏ đi|chán|ngủ|game|phim|tức|điên|chết tiệt|xõa|muốn nghỉ)\b/i,
    EXILES: /\b(cô đơn|buồn|đau|sợ|vô dụng|tại sao|tệ|không ai|tổn thương|yếu đuối|khóc)\b/i,
    SELF: /\b(nhận ra|cảm thấy|tò mò|bình tĩnh|quan sát|hiểu|thương|kết nối|tôi là)\b/i,
  };
  
  type ContextType = 'mind' | 'todo' | 'history' | 'identity';
  
  export const analyzeInternalPart = (
    text: string, 
    context: ContextType, 
    typingSpeed?: 'fast' | 'normal' // Có thể truyền vào từ UI event nếu muốn detect Firefighter gõ nhanh
  ): 'manager' | 'firefighter' | 'exile' | 'self' | 'unclassified' => {
    
    const lowerText = text.toLowerCase();
    let scores = { manager: 0, firefighter: 0, exile: 0, self: 0 };
  
    // 1. Phân tích Keyword
    if (PATTERNS.MANAGER.test(lowerText)) scores.manager += 1;
    if (PATTERNS.FIREFIGHTERS.test(lowerText)) scores.firefighter += 1;
    if (PATTERNS.EXILES.test(lowerText)) scores.exile += 1;
    if (PATTERNS.SELF.test(lowerText)) scores.self += 1;
  
    // 2. Trọng số Ngữ cảnh (Context Weight)
    if (context === 'todo') scores.manager *= 1.5;
    if (context === 'history') scores.exile *= 1.5;
    
    // 3. Hành vi (Behavior)
    // Nếu gõ rất ngắn (< 10 chars) và ở Mind, khả năng cao là Firefighter (xả rác)
    if (context === 'mind' && text.length < 10) scores.firefighter += 0.5;
  
    // 4. Tìm điểm cao nhất
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore === 0) return 'unclassified';
  
    if (scores.self === maxScore) return 'self'; // Ưu tiên Self nếu ngang điểm
    if (scores.firefighter === maxScore) return 'firefighter';
    if (scores.exile === maxScore) return 'exile';
    if (scores.manager === maxScore) return 'manager';
  
    return 'unclassified';
  };