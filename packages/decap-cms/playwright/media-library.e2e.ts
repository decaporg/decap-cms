import { authedTest as test, expect, gotoRoute } from './fixtures';

test.describe('media library', () => {
  test('opens from the header and closes again', async ({ page }) => {
    await gotoRoute(page, '/');

    await page.getByRole('button', { name: 'Media' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Media assets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload', exact: true }).first()).toBeVisible();

    await page.getByLabel('Close').first().click();
    await expect(dialog).toHaveCount(0);
  });
});
