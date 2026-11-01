import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Meridian — статический SPA. Каждая из 10 тем — отдельный ленивый чанк
// (React.lazy + динамический import), CSS тем раскалывается Vite следом.
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});