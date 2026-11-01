import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Meridian — статический SPA на React.
// Каждая из 10 тем — отдельный ленивый чанк (React.lazy + динамический import);
// CSS тем Vite раскалывает следом, поэтому первая загрузка тянет
// только нужную концепцию. Вендоры вынесены в отдельный чанк,
// который кешируется между релизами.
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          return undefined;
        },
      },
    },
  },
});
