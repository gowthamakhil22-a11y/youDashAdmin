import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Set VITE_PROXY_TARGET=http://localhost:8080 in .env.local to use local backend.
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://youdashexpress.com'
  const secure = !proxyTarget.startsWith('http://')

  return {
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // API only under /admin — do NOT proxy /orders (conflicts with React route /orders).
      '/admin': {
        target: proxyTarget,
        changeOrigin: true,
        secure,
      },
      '/ws': {
        target: proxyTarget,
        changeOrigin: true,
        secure,
        ws: true,
      },
      '/public': {
        target: proxyTarget,
        changeOrigin: true,
        secure,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
  }
})
