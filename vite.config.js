import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

function normalizeId(id) {
  return id.replace(/\\/g, '/');
}

function createManualChunks(id) {
  const normalized = normalizeId(id);

  if (!normalized.includes('/node_modules/')) {
    return undefined;
  }

  if (normalized.includes('/react/') || normalized.includes('/react-dom/')) {
    return 'vendor-react';
  }

  if (
    normalized.includes('/three/') ||
    normalized.includes('/@react-three/fiber/') ||
    normalized.includes('/@react-three/drei/')
  ) {
    return 'vendor-three';
  }

  if (normalized.includes('/webtorrent/')) {
    return 'vendor-webtorrent';
  }

  if (normalized.includes('/@mlc-ai/web-llm/')) {
    return 'vendor-llm';
  }

  if (normalized.includes('/sql.js/')) {
    return 'vendor-sql';
  }

  if (normalized.includes('/howler/') || normalized.includes('/tone/')) {
    return 'vendor-audio';
  }

  if (normalized.includes('/motion/')) {
    return 'vendor-motion';
  }

  if (normalized.includes('/zustand/')) {
    return 'vendor-state';
  }

  return 'vendor-misc';
}

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'manifest.json'],
      manifest: {
        name: 'OMNIS APIEN - 世界文明模拟器',
        short_name: 'OMNIS',
        description: '无后端世界文明模拟器，支持离线运行与本地计算。',
        theme_color: '#0a0a0f',
        background_color: '#050508',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: 'omnis-apien-pwa',
        version: '1.0.0',
        categories: ['games', 'entertainment', 'simulation'],
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: '新文明',
            short_name: '新建',
            description: '开始一个全新的数字文明',
            url: '/?action=new-civilization',
          },
          {
            name: '继续游戏',
            short_name: '继续',
            description: '恢复上次保存的文明进度',
            url: '/?action=continue',
          },
          {
            name: '先知模式',
            short_name: '先知',
            description: '以纯音频方式体验文明演化',
            url: '/?mode=blind',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@storage': path.resolve(__dirname, './src/storage'),
      '@warmup': path.resolve(__dirname, './src/warmup'),
      '@bench': path.resolve(__dirname, './src/bench'),
      '@monitor': path.resolve(__dirname, './src/monitor'),
      '@citizen': path.resolve(__dirname, './src/citizen'),
      '@neural': path.resolve(__dirname, './src/neural'),
      '@economy': path.resolve(__dirname, './src/economy'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@network': path.resolve(__dirname, './src/network'),
      '@rendering': path.resolve(__dirname, './src/rendering'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@workers': path.resolve(__dirname, './src/workers'),
      '@sw': path.resolve(__dirname, './src/sw'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@multimodal': path.resolve(__dirname, './src/multimodal'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    port: 5173,
    host: true,
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  build: {
    target: 'esnext',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: createManualChunks,
      },
      external: ['@mlc-ai/web-llm', '@mlc.ai/web-llm'],
    },
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', '@mlc.ai/web-llm'],
  },
});
