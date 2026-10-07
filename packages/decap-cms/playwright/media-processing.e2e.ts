import { authedTest as test, expect, gotoRoute } from './fixtures';

import type { Page } from '@playwright/test';

/**
 * decaporg #7845: `media_processing` converts an uploaded image in the
 * browser before it is stored. WebP goes through the WASM encoder, whose
 * `.wasm` files the demo bundle ships beside itself (vite.webp-wasm.ts), so
 * this also proves they load from there.
 */
async function enableMediaProcessing(page: Page, block: string) {
  await page.route('**/config.yml', async route => {
    const response = await route.fetch();
    const config = await response.text();
    await route.fulfill({
      response,
      body: config.replace('media_folder: assets/uploads\n', `media_folder: assets/uploads\n${block}`),
    });
  });
}

async function uploadThroughMediaLibrary(page: Page, file: string) {
  await gotoRoute(page, '/');
  await page.getByRole('button', { name: 'Media', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type=file]').setInputFiles(file);
}

/** First bytes of a stored upload, read from the test backend's in-memory repo. */
function storedFileHeader(page: Page, name: string) {
  return page.evaluate(async fileName => {
    // The test backend keeps the uploaded AssetProxy as `content`.
    const file = (window as any).repoFiles?.assets?.uploads?.[fileName]?.content?.fileObj as File | undefined;
    if (!file) return null;
    const bytes = new Uint8Array(await file.arrayBuffer());
    return {
      type: file.type,
      riff: String.fromCharCode(...bytes.slice(0, 4)),
      webp: String.fromCharCode(...bytes.slice(8, 12)),
      jpegMagic: bytes[0] === 0xff && bytes[1] === 0xd8,
    };
  }, name);
}

test.describe('media_processing', () => {
  test('converts an uploaded PNG to WebP with the WASM encoder', async ({ page }) => {
    const wasmRequests: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('.wasm')) wasmRequests.push(request.url());
    });
    await enableMediaProcessing(
      page,
      'media_processing:\n  enabled: true\n  format: { enabled: true, default: webp }\n  quality: 80\n',
    );

    await uploadThroughMediaLibrary(page, 'dev-test/nf-logo.png');

    await expect.poll(() => storedFileHeader(page, 'nf-logo.webp'), { timeout: 15000 }).toEqual({
      type: 'image/webp',
      riff: 'RIFF',
      webp: 'WEBP',
      jpegMagic: false,
    });
    // Loaded from beside the bundle, not inlined.
    expect(wasmRequests.some(url => /\/dist\/webp_enc(_simd)?\.wasm$/.test(url))).toBe(true);
  });

  test('converts to JPEG with the canvas encoder and loads no WASM', async ({ page }) => {
    const wasmRequests: string[] = [];
    page.on('request', request => {
      if (request.url().endsWith('.wasm')) wasmRequests.push(request.url());
    });
    await enableMediaProcessing(
      page,
      'media_processing:\n  enabled: true\n  format: { enabled: true, default: jpeg }\n',
    );

    await uploadThroughMediaLibrary(page, 'dev-test/nf-logo.png');

    await expect.poll(() => storedFileHeader(page, 'nf-logo.jpg'), { timeout: 15000 }).toMatchObject({
      type: 'image/jpeg',
      jpegMagic: true,
    });
    expect(wasmRequests).toEqual([]);
  });
});
