/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bảng màu Linear chuẩn: Trắng tuyệt đối và Slate
        background: "#FFFFFF",
        primary: "#2563EB", // Xanh đậm điểm nhấn
        border: "#E2E8F0",   // Slate-200 mảnh
        slate: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          400: "#94A3B8",
          500: "#64748B",
          900: "#0F172A",
        }
      },
      borderRadius: {
        // Chuẩn bo góc Linear
        DEFAULT: "6px",
        'md': "6px",
      },
      fontFamily: {
        // Ưu tiên Inter toàn hệ thống
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'none': 'none', // Loại bỏ 100% đổ bóng
      }
    },
  },
  plugins: [],
}