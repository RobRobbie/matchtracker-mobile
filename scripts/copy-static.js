import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const items = [
  'app-mobile.js', 'style-mobile.css', 'manifest.json', 'matchtracker-icon-512-v2.png',
  'assets', 'src'
];

for (const item of items) {
  const source = resolve(root, item);
  if (existsSync(source)) cpSync(source, resolve(output, item), { recursive: true, force: true });
}

