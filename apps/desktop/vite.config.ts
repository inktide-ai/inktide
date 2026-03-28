import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Tauri dev host (set by Tauri CLI when developing on mobile)
const host = process.env.TAURI_DEV_HOST

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Tauri requires these settings
  clearScreen: false,

  server: {
    // Tauri expects a fixed port — fail loudly instead of picking a random one
    port: 3001,
    strictPort: true,
    host: host ?? false,
    hmr: host
      ? { protocol: 'ws', host, port: 3001 }
      : undefined,
    watch: {
      // Ignore Rust recompilation — it triggers its own HMR via Tauri
      ignored: ['**/src-tauri/**'],
    },
    proxy: {
      // Dev-only: proxy API calls to the .NET backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Tauri uses Chromium on Windows/Linux and WebKit on macOS.
    // ES2021 is safe for both engines used by Tauri v2.
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Do not minify for debug builds to keep DevTools readable
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },

  // Expose TAURI_ env vars to the renderer via import.meta.env
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
