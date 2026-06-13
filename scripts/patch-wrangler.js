// Remove bindings that require manual Cloudflare resource setup (KV, Images).
// The Worker functions correctly without them — sessions and image transforms
// are not used by this site.
import { readFileSync, writeFileSync } from 'fs';

const path = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(path, 'utf-8'));

delete config.kv_namespaces;
delete config.images;

writeFileSync(path, JSON.stringify(config, null, 2));
console.log('patched dist/server/wrangler.json: removed kv_namespaces and images bindings');
