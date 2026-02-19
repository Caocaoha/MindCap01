import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // [FIX]: Khai báo plugin để xóa lỗi TS2304

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Chiến lược 'injectManifest' để sử dụng file src/service-worker.ts tùy chỉnh của bạn
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectManifest: {
        // [FIX]: Chỉ đặt tên file để Vite tự động đẩy vào thư mục dist khi build
        swDest: 'service-worker.js', 
      },
      manifest: {
        name: 'Mind Cap',
        short_name: 'MindCap',
        description: 'Capture your thoughts, liberate your mind.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png', // Đảm bảo tệp này đã có trong /public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});