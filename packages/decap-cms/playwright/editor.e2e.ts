import { authedTest as test, expect, gotoRoute } from './fixtures';

test.describe('entry editor', () => {
  test('opens an entry and exposes editable fields', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');

    await page.getByRole('link', { name: /This is post #/ }).first().click();

    await expect(page).toHaveURL(/#\/collections\/posts\/entries\//);

    // The title widget is a labelled text input pre-filled from the entry.
    const title = page.getByLabel('Title').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveValue(/This is post #/);

    // Field is editable.
    await title.fill('Edited by Playwright');
    await expect(title).toHaveValue('Edited by Playwright');

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  });

  test('back control returns to the collection list', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
    await page.getByRole('link', { name: /This is post #/ }).first().click();
    await expect(page).toHaveURL(/\/entries\//);

    // The editor toolbar's back link ("← Writing in Posts collection").
    await page.getByRole('link', { name: /Writing in Posts collection/ }).click();

    await expect(page).toHaveURL(/#\/collections\/posts$/);
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
  });

  test('saving a blank new entry surfaces a validation notice', async ({ page }) => {
    // Deep-linking straight to `/collections/posts/new` via `gotoRoute` never
    // works: per DCMS-431 the app-shell header (the `banner` landmark
    // `gotoRoute` waits on as its boot signal) is unmounted while an editor
    // route is active, even on direct deep-link. Reach the route the same
    // way `editor-topnav.e2e.ts` does — navigate to the collection list
    // first (where the header is present) and click through.
    await gotoRoute(page, '/collections/posts');
    await page.getByRole('link', { name: /New Post/i }).click();
    await expect(page).toHaveURL(/#\/collections\/posts\/new$/);

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('region', { name: /notification/i })).toContainText(
      /missed \d+ required fields?/i,
    );
  });
});
