import { authedTest as test, expect, gotoRoute } from './fixtures';

import type { Page } from '@playwright/test';

/**
 * decaporg #7451: a folder collection's `limit` hides its create actions once
 * it holds that many entries. The demo's FAQ collection holds several.
 */
async function limitFaqCollection(page: Page, limit: number) {
  await page.route('**/config.yml', async route => {
    const response = await route.fetch();
    const config = await response.text();
    await route.fulfill({
      response,
      body: config.replace("    folder: '_faqs'\n", `    folder: '_faqs'\n    limit: ${limit}\n`),
    });
  });
}

test.describe('collection limit', () => {
  test('hides the create actions once the limit is reached', async ({ page }) => {
    await limitFaqCollection(page, 1);
    await gotoRoute(page, '/collections/faq');
    await expect(page.getByRole('link', { name: /This FAQ item #/ }).first()).toBeVisible();

    await expect(page.getByRole('link', { name: /New FAQ/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Quick add' }).click();
    await expect(page.getByRole('menuitem', { name: 'Post', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'FAQ' })).toHaveCount(0);
  });

  test('keeps the create actions below the limit', async ({ page }) => {
    await limitFaqCollection(page, 100);
    await gotoRoute(page, '/collections/faq');
    await expect(page.getByRole('link', { name: /This FAQ item #/ }).first()).toBeVisible();

    await expect(page.getByRole('link', { name: /New FAQ/i })).toBeVisible();

    await page.getByRole('button', { name: 'Quick add' }).click();
    await expect(page.getByRole('menuitem', { name: 'FAQ' })).toBeVisible();
  });
});
