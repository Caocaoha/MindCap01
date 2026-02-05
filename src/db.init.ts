import { db, type PromptConfig, type AppState } from "./utils/db";

// 1. Dữ liệu mẫu cho Cấu hình Prompt (Ví dụ)
const SAMPLE_PROMPTS: PromptConfig[] = [
  {
    // Không cần điền id, Dexie sẽ tự tăng (1, 2, 3...)
    key: "default_system",
    name: "Hệ thống Mặc định",
    content: "Bạn là trợ lý AI hữu ích trong Mind OS.",
    isActive: true
  },
  {
    key: "creative_writer",
    name: "Sáng tạo nội dung",
    content: "Hãy đóng vai một nhà văn sáng tạo, dùng ngôn từ bay bổng...",
    isActive: false
  },
  {
    key: "code_expert",
    name: "Chuyên gia Lập trình",
    content: "Bạn là kỹ sư phần mềm cao cấp. Hãy viết code sạch và tối ưu...",
    isActive: false
  }
];

// 2. Dữ liệu mẫu cho Trạng thái Ứng dụng
const SAMPLE_APP_STATE: AppState[] = [
  {
    key: "user_preferences",
    value: {
      theme: "light",
      language: "vi",
      notifications: true
    }
  },
  {
    key: "last_sync",
    value: {
      timestamp: Date.now(),
      status: "success"
    }
  },
  {
    key: "onboarding",
    value: {
      hasSeenIntro: false,
      step: 1
    }
  }
];

// 3. Hàm khởi tạo Database
export const initializeDatabase = async () => {
  try {
    // Kiểm tra và khởi tạo Prompt Configs
    const promptCount = await db.prompt_configs.count();
    if (promptCount === 0) {
      await db.prompt_configs.bulkAdd(SAMPLE_PROMPTS);
      console.log("✅ Đã khởi tạo dữ liệu mẫu: Prompt Configs");
    }

    // Kiểm tra và khởi tạo App State
    const stateCount = await db.app_state.count();
    if (stateCount === 0) {
      await db.app_state.bulkAdd(SAMPLE_APP_STATE);
      console.log("✅ Đã khởi tạo dữ liệu mẫu: App State");
    }

  } catch (error) {
    console.error("❌ Lỗi khởi tạo Database:", error);
  }
};