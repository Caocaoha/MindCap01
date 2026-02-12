export const levelEngine = {
    // Bảng XP cần thiết để lên cấp tiếp theo
    // Index 1 = Level 1 cần 100 XP để lên Level 2
    THRESHOLDS: [0, 100, 200, 400, 800, 1500, 3000, 5000],
  
    /**
     * Tính lượng XP cần thiết để lên cấp tiếp theo
     */
    getXpForNextLevel: (currentLevel: number): number => {
      // Nếu level cao hơn bảng định nghĩa, mỗi level tăng thêm 1000 XP khó
      if (currentLevel >= 7) return 5000 + (currentLevel - 7) * 1000;
      
      // Mặc định trả về giá trị trong bảng hoặc 100
      return levelEngine.THRESHOLDS[currentLevel] || 100;
    },
  
    // Bảng điểm thưởng (Scoring Matrix)
    SCORING: {
      TASK_COMPLETED: 10,  // Hoàn thành 1 việc
      TASK_CREATED: 2,     // Nhập liệu (Khuyến khích input)
      IDENTITY_LOG: 20,    // Check-in cảm xúc (Khuyến khích soul)
      STREAK_BONUS: 5      // Điểm cộng thêm mỗi ngày streak > 3
    },
  
    /**
     * Tính toán Archetype dựa trên Level và chỉ số Ea (Effort Allocation)
     */
    calculateArchetype: (level: number, eaScore: number): string => {
      if (level < 3) return 'Newbie';
      if (eaScore > 70) return 'Manager-led'; // Làm nhiều nhưng ít reflection
      if (eaScore < 30) return 'Curious Explorer'; // Reflection nhiều nhưng làm ít
      return 'Harmonized'; // Cân bằng
    }
  };