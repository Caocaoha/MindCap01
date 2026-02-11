// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // [Update Mechanism]: Hỏi trước khi update
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mind Cap',
        short_name: 'MindCap',
        description: 'Personal Management OS with Living Memory',
        theme_color: '#ffffff',
        background_color: '#ffffff', // Monochrome style
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // [Offline Strategy]: Cache First cho Assets/Fonts/Images
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 ngày
            },
          },
          // JS/CSS assets mặc định được xử lý bởi StaleWhileRevalidate hoặc CacheFirst của VitePWA
        ]
      }
    })
  ],
});