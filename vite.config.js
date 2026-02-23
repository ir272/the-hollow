import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: '.',
  publicDir: 'public',
  base: command === 'build' ? '/the-hollow/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    open: true,
  },
}));
