export interface IIdentityQuestion {
    id: number;
    stage: 1 | 2 | 3 | 4 | 5;
    content: string;
    helperText?: string;
  }
  
  export interface IIdentityEntry {
    id: string;        // UUID
    questionId: number;
    content: string;   // Nội dung trả lời
    createdAt: number; // Timestamp
  }
  
  export interface IIdentityState {
    // --- TRẠNG THÁI HÀNH TRÌNH ---
    currentQuestionIndex: number; // 0 - 24
    hasCompletedOnboarding: boolean; // True sau khi xong câu 25 lần đầu
    
    // --- LOGIC COOLDOWN (Sau Chặng 1) ---
    isInCooldown: boolean;
    cooldownEndsAt: number | null;
  
    // --- KHO DỮ LIỆU ---
    // Lịch sử trả lời: Key = QuestionID, Value = Mảng các lần trả lời
    logs: Record<number, IIdentityEntry[]>;
    
    // Cache giá trị mới nhất để hiển thị nhanh (Tab Hồ Sơ)
    latestAnswers: Record<number, IIdentityEntry>;
  
    // --- BẢN TUYÊN NGÔN (MANIFESTO - TAB 1) ---
    // Tự động trích xuất từ các câu hỏi cốt lõi
    manifesto: {
      fear: string;           // Q19: Cuộc sống ghê sợ
      vision: string;         // Q20: Tầm nhìn
      nonNegotiables: string; // Q21: Luật chơi
      identity: string;       // Q22: Căn tính
      gapSkills: string;      // Q23: Kỹ năng cốt lõi
    };
  
    // --- ACTIONS ---
    submitAnswer: (questionId: number, content: string) => void;
    resetCooldown: () => void; // Dùng khi hết giờ hoặc dev test
    getHistory: (questionId: number) => IIdentityEntry[];
  }