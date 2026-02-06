import { writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';

const wrapperContent = `#!/usr/bin/env node
// CommonJS wrapper for ESM module
(async () => {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
`;

writeFileSync('dist/index.cjs', wrapperContent);
console.log('Created dist/index.cjs wrapper');

if (!existsSync('dist/data')) {
  mkdirSync('dist/data', { recursive: true });
}
if (existsSync('server/data/seed_data.sql')) {
  copyFileSync('server/data/seed_data.sql', 'dist/data/seed_data.sql');
  console.log('Copied seed_data.sql to dist/data/');
}
