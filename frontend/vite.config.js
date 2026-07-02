import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // strip /api when forwarding if backend isn't mounted there
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})

