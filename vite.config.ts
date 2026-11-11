import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendApi = (env.VITE_API_BASE_URL || 'https://expensesforaptusfinancials-730085095.development.catalystserverless.com/server/expense_services').replace(/\/$/, '') // mismo respaldo que src/lib/api.ts
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
      '/api': {
        target: backendApi,
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ''),
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
