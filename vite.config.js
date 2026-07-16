import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(readFileSync(join(root, 'data/site.json'), 'utf8'));

function injectSiteMeta() {
  return {
    name: 'inject-site-meta',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_TITLE%', site.title)
        .replaceAll('%SITE_DESCRIPTION%', site.description)
        .replaceAll('%SITE_URL%', site.url)
        .replaceAll('%SITE_NAME%', site.name);
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), injectSiteMeta()],
  base: command === 'serve' ? '/' : '/wanikani-marathon-stats/',
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
}));
