import { renameSync, copyFileSync, mkdirSync, existsSync } from 'fs';

// Rename dist/index.js → dist/index.mjs so Node.js treats it unambiguously as ESM
// regardless of any package.json "type" field in the dist/ directory
if (existsSync('dist/index.js')) {
  renameSync('dist/index.js', 'dist/index.mjs');
  console.log('Renamed dist/index.js → dist/index.mjs (explicit ESM)');
}

if (!existsSync('dist/data')) {
  mkdirSync('dist/data', { recursive: true });
}
if (existsSync('server/data/seed_data.sql')) {
  copyFileSync('server/data/seed_data.sql', 'dist/data/seed_data.sql');
  console.log('Copied seed_data.sql to dist/data/');
}
