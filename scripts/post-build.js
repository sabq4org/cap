import { writeFileSync } from 'fs';

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
