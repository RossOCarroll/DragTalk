import { defineConfig } from 'vite';

export default defineConfig({
  base: '/DragTalk/', // GitHub Pages repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});