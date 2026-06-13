// Post-build patch: fix generated wrangler configs and prepare for Pages deploy.
import { readFileSync, writeFileSync, rmSync } from 'fs';

// 1. Remove SESSION KV and Images bindings from the generated Worker config.
const workerConfigPath = 'dist/server/wrangler.json';
const config = JSON.parse(readFileSync(workerConfigPath, 'utf-8'));
delete config.kv_namespaces;
delete config.images;
writeFileSync(workerConfigPath, JSON.stringify(config, null, 2));
console.log('patched dist/server/wrangler.json: removed kv_namespaces and images bindings');

// 2. Delete the wrangler deploy cache to avoid stale config redirects.
rmSync('.wrangler/deploy/config.json', { force: true });
console.log('cleared .wrangler/deploy/config.json');

// 3. Add pages_build_output_dir to wrangler.toml AFTER the build.
//    Adding it before the build breaks the Cloudflare Vite plugin (ASSETS is
//    a reserved name in Pages mode). Adding it here lets wrangler pages deploy
//    find both the project name (from "name") and output dir automatically.
const tomlPath = 'wrangler.toml';
let toml = readFileSync(tomlPath, 'utf-8');
if (!toml.includes('pages_build_output_dir')) {
  writeFileSync(tomlPath, toml.trimEnd() + '\npages_build_output_dir = "dist/client"\n');
  console.log('added pages_build_output_dir = "dist/client" to wrangler.toml');
}
