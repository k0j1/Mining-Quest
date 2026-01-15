
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pagesのリポジトリ名（サブディレクトリ）に合わせてbaseを設定
export default defineConfig({
  plugins: [react()],
  base: '/Mining-Quest/',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
  },
});
