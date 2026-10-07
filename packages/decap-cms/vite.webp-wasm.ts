import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

import type { Plugin } from 'vite';

/**
 * Ships `@jsquash/webp`'s encoder `.wasm` files next to a script-tag bundle
 * instead of inlining them (decaporg #7845, media_processing WebP output).
 *
 * In library mode Vite inlines every asset, so the encoder's
 * `new URL("webp_enc.wasm", import.meta.url)` would add ~0.85 MB of base64 to
 * every download, and in UMD/IIFE output `import.meta` isn't available to
 * resolve it anyway. This plugin
 *   - turns those `new URL(...)` expressions into plain file names, so nothing
 *     is inlined (the app always passes the encoder a `locateFile`, see
 *     `src/lib/util/mediaProcessing.ts`);
 *   - emits the two encoder `.wasm` files beside the bundle under fixed names;
 *   - defines `__DECAP_WEBP_WASM_BESIDE_BUNDLE__` so the app knows to look for
 *     them there. Builds without this plugin (the npm package consumed through
 *     a bundler) leave the encoder's own resolution alone.
 *
 * The files are fetched only when an upload is converted to WebP.
 */
const WASM_FILES = ['webp_enc.wasm', 'webp_enc_simd.wasm'];

export function webpWasmBesideBundle(): Plugin {
  const require = createRequire(import.meta.url);
  const codecDir = path.join(path.dirname(require.resolve('@jsquash/webp/package.json')), 'codec', 'enc');

  return {
    name: 'decap-webp-wasm-beside-bundle',
    config() {
      return { define: { __DECAP_WEBP_WASM_BESIDE_BUNDLE__: 'true' } };
    },
    transform(code, id) {
      if (!id.includes('@jsquash') || !code.includes('import.meta.url')) return null;
      const replaced = code.replace(
        /new URL\(\s*"(webp_(?:enc|dec)(?:_simd)?\.wasm)"\s*,\s*import\.meta\.url\s*\)\.href/g,
        '"$1"',
      );
      return replaced === code ? null : { code: replaced, map: null };
    },
    generateBundle() {
      for (const fileName of WASM_FILES) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(path.join(codecDir, fileName)) });
      }
    },
  };
}
