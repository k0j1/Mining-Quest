
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pagesのリポジトリ名に合わせてbaseを設定します。
// ルートに配置する場合は '/' 、リポジトリ名配下なら './' が安全です。
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
  },
});
