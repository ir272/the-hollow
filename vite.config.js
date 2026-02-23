import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/the-hollow/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    open: true,
  },
});
