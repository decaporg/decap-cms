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

  test('an image chosen in the library fills the image field right away', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
    await page.getByRole('link', { name: /This is post #/ }).first().click();
    await expect(page).toHaveURL(/#\/collections\/posts\/entries\//);

    // The Cover Image field.
    await page.getByText('Choose an image', { exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type=file]').setInputFiles('dev-test/moby-dick.jpg');
    await dialog.getByRole('button', { name: 'Choose selected' }).click();
    await expect(dialog).toHaveCount(0);

    // No other interaction: the field must pick the file up on its own.
    await expect(page.getByText('Choose different image', { exact: true })).toBeVisible();
    await expect(page.locator('img[src$="moby-dick.jpg"]').first()).toBeAttached();
  });
});
