import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Local/dev defaults to '/'; TEST gateway serves the UI under /ui/.
  base: process.env.VITE_BASE || '/',
  plugins: [vue(), tailwindcss()],
});
