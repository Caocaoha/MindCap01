// src/utils/nlpEngine.ts

export interface ParsedData {
    content: string;
    quantity?: number;
    unit?: string;
  }
  
  export const parseInputText = (text: string): ParsedData => {
    // Regex bắt pattern: số + khoảng trắng + đơn vị (vd: 30p, 2 giờ, 10 trang)
    const regex = /(\d+)\s*([a-zA-Zà-ỹ]+)/i;
    const match = text.match(regex);
  
    if (match) {
      return {
        content: text.replace(match[0], '').trim(), // Loại bỏ phần định lượng khỏi content
        quantity: parseInt(match[1], 10),
        unit: match[2].toLowerCase(),
      };
    }
  
    return { content: text.trim() };
  };
  
  // Hàm định danh Priority dựa trên góc kéo (Quadrant)
  export const getPriorityFromAngle = (angle: number): 'critical' | 'urgent' | 'important' | 'normal' => {
    // Angle: -180 to 180 (from Math.atan2)
    // ↖️ TL (-180 to -90): Normal (Spec gốc là Urgent, đổi lại theo logic góc phần tư cho hợp lý hoặc map tùy ý)
    // Mapping lại theo Spec:
    // ↖️ Trên-Trái (-135°): Normal
    // ↗️ Trên-Phải (-45°): Urgent
    // ↙️ Dưới-Trái (135°): Needed (Important)
    // ↘️ Dưới-Phải (45°): Critical
    
    if (angle >= -180 && angle < -90) return 'normal';   // TL
    if (angle >= -90 && angle < 0) return 'urgent';      // TR
    if (angle >= 0 && angle < 90) return 'critical';     // BR
    return 'important';                                  // BL
  };