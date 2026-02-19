import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts', // Đây là tệp nguồn để Vite biên dịch
      injectManifest: {
        // [FIX QUAN TRỌNG]: Chỉ định rõ tệp nguồn cho bước Inject Manifest
        swSrc: 'src/service-worker.ts', 
        // [FIX]: Tên tệp đầu ra sau khi build xong
        swDest: 'dist/service-worker.js',
      },
      manifest: {
        name: 'Mind Cap',
        short_name: 'MindCap',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192x192.png',
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