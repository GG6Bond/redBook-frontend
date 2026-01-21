import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  server: {
    // 开发模式下把以 /api 开头的请求代理到后端服务
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        // 保持 /api 前缀传递到后端（后端已配置 context-path: /api）
        rewrite: (path) => path,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
