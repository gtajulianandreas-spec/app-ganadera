import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom'
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    host: true
  },
  preview: {
    port: 4173,
    allowedHosts: true,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            if (id.includes('xlsx')) return 'vendor-excel';
            if (id.includes('dexie')) return 'vendor-db';
            if (id.includes('lucide-react')) return 'vendor-icons';
          }
        }
      }
    }
  }
});
