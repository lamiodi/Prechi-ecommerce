import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-icons': ['@phosphor-icons/react', 'lucide-react'],
          'utils': ['axios', 'uuid', 'date-fns', 'motion', 'clsx', 'tailwind-merge'],
        }
      }
    },
    chunkSizeWarningLimit: 800
  },
  esbuild: {
    // Keep error/warn for prod debugging; strip noisy/debug statements
    pure: ['console.log', 'console.debug', 'console.info'],
    drop: ['debugger'],
  }
});

