import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Імпортуємо новий Tailwind v4

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // Активуємо Tailwind як плагін для Vite
  ],
  server: {
    proxy: {
      // Перенаправляємо запити з фронтенду (порт 5173) на бекенд (порт 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
