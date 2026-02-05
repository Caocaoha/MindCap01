// --- CẤU HÌNH NHẬN DIỆN (REGEX) ---
const QUANTITY_REGEX = /(\d+(?:[.,]\d+)?)\s*(km|m|lít|lit|ml|phút|phut|h|giờ|trang|cốc|ly|bát|chén|lần|cái|bước|steps)/i;
const FREQ_VI_REGEX = /(mỗi|hàng|cách)\s+(ngày|tuần|tháng|năm|thứ)/i;
const FREQ_EN_REGEX = /(daily|weekly|monthly|every)/i;

// TỪ ĐIỂN GỢI Ý (ACTION MAPPING)
const ACTION_MAP: Record<string, { defaultQty: number; unit: string }> = {
  'chạy': { defaultQty: 5, unit: 'km' },
  'đi bộ': { defaultQty: 30, unit: 'phút' },
  'bơi': { defaultQty: 500, unit: 'm' },
  'hít đất': { defaultQty: 20, unit: 'cái' },
  'uống': { defaultQty: 1, unit: 'cốc' },
  'đọc': { defaultQty: 10, unit: 'trang' },
  'học': { defaultQty: 25, unit: 'phút' },
  'code': { defaultQty: 1, unit: 'giờ' }
};

export interface ParseResult {
  quantity: number;
  unit: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  is_detected: boolean;
  suggestion_label?: string;
}

export const parseInputText = (text: string): ParseResult => {
  const lowerText = text.toLowerCase();
  let result: ParseResult = {
    quantity: 1, unit: 'lần', frequency: 'once', is_detected: false
  };

  // 1. Bóc tách Số + Đơn vị
  const qtyMatch = text.match(QUANTITY_REGEX);
  if (qtyMatch) {
    result.quantity = parseFloat(qtyMatch[1].replace(',', '.'));
    result.unit = qtyMatch[2];
    result.is_detected = true;
  } else {
    // Đoán qua hành động
    for (const [key, config] of Object.entries(ACTION_MAP)) {
      if (lowerText.includes(key)) {
        result.quantity = config.defaultQty;
        result.unit = config.unit;
        result.suggestion_label = `Thêm ${config.defaultQty} ${config.unit}?`;
        break; 
      }
    }
  }

  // 2. Bóc tách Tần suất
  if (FREQ_VI_REGEX.test(lowerText) || FREQ_EN_REGEX.test(lowerText)) {
    result.is_detected = true;
    if (lowerText.includes('tuần') || lowerText.includes('weekly')) result.frequency = 'weekly';
    else if (lowerText.includes('tháng') || lowerText.includes('monthly')) result.frequency = 'monthly';
    else result.frequency = 'daily';
  }

  return result;
};