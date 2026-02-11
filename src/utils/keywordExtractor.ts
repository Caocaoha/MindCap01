// Danh sách từ dừng (Stopwords) tiếng Việt cơ bản để lọc bỏ
const STOP_WORDS = new Set([
    'là', 'của', 'và', 'những', 'cái', 'việc', 'trong', 'khi', 'đang', 
    'để', 'với', 'có', 'không', 'như', 'nhưng', 'lại', 'vào', 'ra'
  ]);
  
  export const extractKeywords = (text: string): string[] => {
    if (!text) return [];
  
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Bỏ dấu câu
      .split(/\s+/) // Tách từ
      .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Lọc rác
  };