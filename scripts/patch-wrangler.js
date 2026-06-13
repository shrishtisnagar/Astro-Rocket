// Remove bindings that require manual Cloudflare resource setup (KV, Images).
// The Worker functions correctly without them — sessions and image transforms
// are not used by this site.
import { readFileSync, writeFileSync, rmSync } from 'fs';

const path = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(path, 'utf-8'));

delete config.kv_namespaces;
delete config.images;

writeFileSync(path, JSON.stringify(config, null, 2));
console.log('patched dist/server/wrangler.json: removed kv_namespaces and images bindings');
console.log('final wrangler config:', JSON.stringify(config, null, 2));

// Delete the cached deploy config so Wrangler doesn't remember the SESSION
// binding from a previous build and try to re-provision it.
rmSync('.wrangler/deploy/config.json', { force: true });
console.log('cleared .wrangler/deploy/config.json');
