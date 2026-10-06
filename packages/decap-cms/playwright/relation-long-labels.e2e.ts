import { authedTest as test, expect, gotoRoute } from './fixtures';

import type { Page } from '@playwright/test';

/**
 * decaporg #7968: long relation labels truncate (with the full text in a
 * tooltip) instead of widening the option menu or the selected-value chips.
 */
const longTitle = 'An extremely long post title '.repeat(12).trim();

async function addLongTitlePost(page: Page) {
  await page.route('**/repo-fixtures.js', async route => {
    const response = await route.fetch();
    const fixtures = await response.text();
    await route.fulfill({
      response,
      body:
        `${fixtures}\nwindow.repoFiles._posts['2020-01-01-long.md'] = { content: '---\\ntitle: "${longTitle}"\\nrelation_test: true\\ndate: 2020-01-01T00:00:00.000Z\\n---\\n\\nbody' };\n`,
    });
  });
}

test.describe('relation widget with long labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await addLongTitlePost(page);
  });

  test('keeps options as wide as the field', async ({ page }) => {
    await gotoRoute(page, '/collections/kitchenSink');
    await page.getByRole('link', { name: /New Kitchen Sink/i }).click();
    const input = page.getByLabel('Related Post').first();
    await input.click();
    await input.fill('extremely');

    const option = page.getByRole('option', { name: /An extremely long/ }).first();
    await expect(option).toBeVisible();
    // The Kitchen Sink relation's display template appends to the title.
    await expect(option).toHaveAttribute('title', new RegExp(`^${longTitle}`));

    const inputBox = (await input.locator('xpath=ancestor::*[@data-slot="combobox-input-group"][1]').boundingBox())!;
    const optionBox = (await option.boundingBox())!;
    expect(optionBox.width).toBeLessThanOrEqual(inputBox.width + 1);
  });

  test('truncates a selected value chip in a multiple relation', async ({ page }) => {
    await gotoRoute(page, '/collections/restaurants');
    await page.getByRole('link', { name: /New Restaurant/i }).click();
    const input = page.locator('[data-slot="combobox-input"]').first();
    await input.click();
    await input.fill('extremely');
    await page.getByRole('option', { name: /An extremely long/ }).first().click();

    const chip = page.locator('[data-slot="combobox-chip"]').first();
    await expect(chip).toBeVisible();
    await expect(chip.locator(`[title="${longTitle}"]`)).toBeVisible();
    expect((await chip.boundingBox())!.width).toBeLessThan(360);
  });
});
