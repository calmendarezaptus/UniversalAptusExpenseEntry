import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const timeEntryApi = (env.VITE_TIME_ENTRY_API_BASE_URL || 'https://timeentryforaptusfinancials-730085095.development.catalystserverless.com/server/time_entry_services').replace(/\/$/, '')
  return {
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api/time-entry': {
        target: timeEntryApi,
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api\/time-entry/, ''),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  }
})
