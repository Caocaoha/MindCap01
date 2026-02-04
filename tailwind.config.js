/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'lg': '6px', // Đúng theo đặc tả bo góc 6px 
      },
      colors: {
        border: '#E2E8F0', // Màu border mảnh 
        primary: '#2563EB', // Màu điểm nhấn Blue 600 
      }
    },
  },
  plugins: [],
}