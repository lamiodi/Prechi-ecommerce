import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-icons': ['@phosphor-icons/react', 'lucide-react'],
          'utils': ['axios', 'uuid', 'date-fns', 'framer-motion', 'clsx', 'tailwind-merge'],
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
});
