import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  root: './e2e/test-app',
  build: {
    outDir: '../../dist-e2e',
  }
})