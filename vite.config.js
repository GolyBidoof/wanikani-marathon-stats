import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'serve' ? '/' : '/wanikani-marathon-stats/',
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));
