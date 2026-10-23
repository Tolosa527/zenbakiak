import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/docs/zenbakiak.md')) {
            return 'basque-number-reference'
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
