// Prepare the build output for Cloudflare Pages deployment.
// Cloudflare Pages needs the Worker at _worker.js inside the output directory.
// This copies dist/server/ into dist/client/server/ and creates the entry shim.
import { cpSync, writeFileSync, rmSync } from 'fs';

// Clean up any previous setup
rmSync('dist/client/server', { recursive: true, force: true });

// Copy server chunks into the client output directory
cpSync('dist/server', 'dist/client/server', { recursive: true });

// Create _worker.js shim that Cloudflare Pages picks up automatically
writeFileSync('dist/client/_worker.js', `export { default } from './server/entry.mjs';\n`);

console.log('Cloudflare Pages setup complete: dist/client/_worker.js created');
