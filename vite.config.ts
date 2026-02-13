import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', //  Hiển thị thông báo khi có bản cập nhật mới
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // Cache toàn bộ tài nguyên 
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'CacheFirst', // Ưu tiên bộ nhớ đệm để tải tức thì 
          }
        ],
        cleanupOutdatedCaches: true, // Xóa cache cũ để tránh xung đột 
      },
      manifest: {
        name: 'Mind Cap',
        short_name: 'MindCap',
        description: 'Personal Mind Operating System',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', //  Giao diện ứng dụng độc lập
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});