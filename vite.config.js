import { defineConfig } from 'vite';

export default defineConfig({
  base: '/DragTalk/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        login: 'login.html'
      }
    }
  }
});