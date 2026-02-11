// src/features/echo/KeywordExtractor.ts

const STOP_WORDS = new Set([
    'là', 'của', 'và', 'với', 'trong', 'có', 'để', 'một', 'những', 'thì', 'mà', 'còn', 
    'này', 'đó', 'được', 'cho', 'đến', 'như', 'về', 'tại', 'ra', 'vào', 'lên', 'xuống'
  ]);
  
  // Các từ khóa quá phổ biến gây "nhiễu" liên kết (Noise)
  const NOISE_WORDS = new Set([
    'hôm nay', 'làm việc', 'mục tiêu', 'ghi chú', 'công việc', 'ý tưởng'
  ]);
  
  export const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    
    // Chuyển về chữ thường, loại bỏ ký tự đặc biệt
    const cleanText = text.toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ');
    
    const words = cleanText.split(/\s+/);
    
    const filtered = words.filter(word => 
      word.length > 2 &&               // Bỏ từ quá ngắn
      !STOP_WORDS.has(word) &&         // Bỏ từ dừng
      !NOISE_WORDS.has(word)           // Bỏ từ nhiễu
    );
  
    return Array.from(new Set(filtered)); // Lấy duy nhất
  };