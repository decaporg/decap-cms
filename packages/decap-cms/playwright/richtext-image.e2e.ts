import { authedTest as test, expect, gotoRoute } from './fixtures';

/**
 * The built-in "Image" editor component: insert an image into a richtext
 * field, pick it in the media library, and see it in the component's own
 * field, in the preview and in the field's markdown.
 */
test.describe('richtext image component', () => {
  test('inserts an image chosen in the media library', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
    await page.getByRole('link', { name: /This is post #/ }).first().click();
    await expect(page).toHaveURL(/#\/collections\/posts\/entries\//);

    await page.locator('[data-slate-editor="true"]').first().click();
    await page.getByRole('button', { name: 'Add Component' }).first().click();
    await page.getByRole('menuitem', { name: 'Image' }).click();

    await page.getByRole('button', { name: 'Choose an image (required)' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type=file]').setInputFiles('dev-test/moby-dick.jpg');
    await dialog.getByRole('button', { name: 'Choose selected' }).click();
    await expect(dialog).toHaveCount(0);

    await expect(page.getByText('Choose different image', { exact: true })).toBeVisible();
    await page.getByRole('textbox', { name: 'Alt Text' }).fill('A whale');

    const previewImage = page.frameLocator('#preview-pane').locator('img[src$="moby-dick.jpg"]');
    await expect(previewImage).toHaveAttribute('alt', 'A whale');

    // Switch the body to markdown mode and check what the component wrote.
    const modeToggle = page.getByText('Markdown', { exact: true }).locator('xpath=..');
    await modeToggle.getByRole('switch').click();
    const rawEditor = modeToggle.locator('xpath=following::*[@role="textbox"][1]');
    await expect(rawEditor).toContainText('![A whale](/assets/uploads/moby-dick.jpg)');
  });
});
