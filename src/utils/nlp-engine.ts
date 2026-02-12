// src/utils/nlp-engine.ts

// Regex Patterns Existing...
const TAG_REGEX = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g; 
const COMMAND_REGEX = /^\/(\w+)\s+(.*)/; 
const QUANTITY_REGEX = /(\d+([.,]\d+)?)\s*(phút|p|giờ|h|giây|s|km|m|cm|mm|kg|g|mg|l|ml|trang|cái|lần|hiệp|set|rep)/i;

// [NEW] Regex cho Tần suất (Frequency)
// Hỗ trợ: "mỗi ngày", "hàng tuần", "2 lần/tuần", "thứ 2,4,6"
const FREQUENCY_REGEX = /(mỗi|hằng|hàng)\s+(ngày|tuần|tháng|năm)|(\d+)\s*lần\/(ngày|tuần|tháng)|(thứ\s+[\d,]+)/i;

export interface ParsedInput {
  raw: string;
  cleanText: string;
  tags: string[];
  command?: string;
  commandArgs?: string;
  type: 'note' | 'task' | 'thought';
  meta: {
    quantity?: number;
    unit?: string;
    frequency?: string; // [NEW]
  };
}

export const parseInput = (text: string): ParsedInput => {
  if (!text) return { raw: '', cleanText: '', tags: [], type: 'note', meta: {} };

  let cleanText = text;
  const tags: string[] = [];
  let command: string | undefined;
  let commandArgs: string | undefined;
  let type: 'note' | 'task' | 'thought' = 'note';
  let quantity: number | undefined;
  let unit: string | undefined;
  let frequency: string | undefined;

  // 1. Extract Tags
  const tagMatches = text.match(TAG_REGEX);
  if (tagMatches) {
    tagMatches.forEach(tag => tags.push(tag.replace('#', '')));
    cleanText = cleanText.replace(TAG_REGEX, '').trim();
  }

  // 2. Extract Quantity & Unit
  const qtyMatch = text.match(QUANTITY_REGEX);
  if (qtyMatch) {
    const numStr = qtyMatch[1].replace(',', '.');
    quantity = parseFloat(numStr);
    unit = qtyMatch[3].toLowerCase();
    
    if (unit === 'p') unit = 'phút';
    if (unit === 'h') unit = 'giờ';
    if (unit === 's') unit = 'giây';
  }

  // 3. [NEW] Extract Frequency
  const freqMatch = text.match(FREQUENCY_REGEX);
  if (freqMatch) {
    frequency = freqMatch[0].trim();
    // cleanText = cleanText.replace(freqMatch[0], '').trim(); // Tùy chọn xóa khỏi text
  }

  // 4. Extract Command
  const cmdMatch = text.match(COMMAND_REGEX);
  if (cmdMatch) {
    command = cmdMatch[1].toLowerCase();
    commandArgs = cmdMatch[2];
    cleanText = commandArgs; 
    
    if (['todo', 'task', 't'].includes(command)) type = 'task';
    else if (['idea', 'i', 'note'].includes(command)) type = 'thought';
  } else {
    // Logic: Có tần suất hoặc định lượng -> Task, ngược lại -> Note
    if (frequency || quantity) type = 'task';
    else type = 'thought'; // Mặc định là Thought thay vì Note cho an toàn
  }

  return {
    raw: text,
    cleanText: cleanText.trim(),
    tags,
    command,
    commandArgs,
    type,
    meta: { quantity, unit, frequency }
  };
};

export const generateSlug = (text: string): string => {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
};