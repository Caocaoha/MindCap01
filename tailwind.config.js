/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // [MỚI] Hệ màu cho Identity OS
        identity: {
          dark: '#0f172a',    // Màu nền cho chế độ Lặn Sâu (Deep Dive) [cite: 61, 64]
          light: '#f8fafc',   // Màu nền cho chế độ Hiện tại/Ngôi (Surface) 
          blue: '#2563eb',    // Màu chủ đạo cho tab Hiện tại và Sa bàn [cite: 1, 16]
          accent: '#7c3aed',  // Màu tím cho Nhật ký và Vô thức số
          warning: '#ef4444', // Màu cho Tuyên ngôn giới hạn và Lệch pha [cite: 19, 60]
          gold: '#f59e0b',    // Màu cho Hạt giống/Bookmark
        }
      },
      fontFamily: {
        // [MỚI] Chuyển đổi trạng thái tâm lý qua Font chữ
        serif: ['"Crimson Pro"', 'Georgia', 'serif'], // Dùng cho chặng Lặn (Audit) 
        sans: ['Inter', 'system-ui', 'sans-serif'],    // Dùng cho chặng Ngôi (Hành động) 
      },
      animation: {
        // Hiệu ứng Pulsing cho Dự án ưu tiên [cite: 4]
        'identity-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}