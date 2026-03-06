import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hlsTarget = env.VITE_HLS_TARGET || env.VITE_PROXY_TARGET || 'http://192.168.7.10:8000'
  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', '/pwa_icons/apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Aqua',
          short_name: 'Aqua',
          description: 'Aqua: Análise Pluviométrica',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa_icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa_icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          id: 'com.analise-pluviometrica.app',
          orientation: 'any',
          background_color: '#ffffff',
          start_url: '.',
          launch_handler: {
            client_mode: ['navigate-existing', 'auto'],
          },
        },
        workbox: {
          // Adiciona o service worker do firebase ao topo do service worker gerado
          importScripts: ['firebase-messaging-sw.js'],
          // Increase max file size to cache (default is 2 MiB); allow larger app bundle
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
        },
        devOptions: {
          enabled: true,
        },
      }),
      tailwindcss(),
    ],
    server: {
      // https: true,
      host: true,
      allowedHosts: ['aqua.michalski.app'],
      proxy: {
        // Dev proxy to avoid CORS: calls to /api/* will be forwarded to the backend
        '/api': {
          // target: 'http://127.0.0.1:8000/',

          target: 'http://api.aqua.michalski.app/',
          // target: http://192.168.7.10:8000/
          changeOrigin: true,
          secure: false,
        },
        // Proxy for HLS media to bypass CORS and allow hls.js XHR loads
        // Target is configurable via VITE_HLS_TARGET; falls back to the previous LAN IP.
        '/hls': {
          target: hlsTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/hls/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
