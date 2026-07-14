import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const vendorDir = join(root, 'public', 'vendor');

mkdirSync(vendorDir, { recursive: true });
copyFileSync(
  join(root, 'node_modules', 'gifler', 'gifler.min.js'),
  join(vendorDir, 'gifler.min.js'),
);
