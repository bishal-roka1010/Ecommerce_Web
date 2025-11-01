import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// proxy /api to Django 127.0.0.1:8000 for dev
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    }
  }
})
