// src/services/echo/keywordExtractor.ts
import { VI_STOPWORDS } from './constants';

export const extractKeywords = (text: string): string[] => {
  if (!text || text.length < 3) return [];

  // 1. Normalize: Chữ thường
  const normalized = text.toLowerCase();

  // 2. Tokenize: Bỏ ký tự đặc biệt, tách từ
  // Regex: Chỉ giữ lại chữ cái và số, thay thế còn lại bằng khoảng trắng
  const tokens = normalized.replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ').split(/\s+/);

  // 3. Filter: Bỏ stopwords & từ ngắn (<2 ký tự)
  const keywords = tokens.filter(t => t.length > 1 && !VI_STOPWORDS.has(t));

  // 4. Unique: Loại bỏ trùng lặp
  return Array.from(new Set(keywords));
};