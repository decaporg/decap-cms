import { authedTest as test, expect, gotoRoute, sidebar } from './fixtures';

test.describe('navigation', () => {
  test('sidebar link opens a collection entry list', async ({ page }) => {
    await gotoRoute(page, '/');

    await sidebar(page).getByRole('link', { name: 'Posts', exact: true }).click();

    await expect(page).toHaveURL(/#\/collections\/posts$/);
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
    await expect(page.getByRole('link', { name: /New Post/i })).toBeVisible();

    // The seeded repo fixture yields a list of post entries.
    await expect(page.getByRole('link', { name: /This is post #/ }).first()).toBeVisible();
  });

  test('deep-links straight to a collection route', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');

    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
    await expect(page.getByRole('link', { name: /New Post/i })).toBeVisible();
  });

  test('deep-linking to a nonexistent entry surfaces exactly one failure toast', async ({ page }) => {
    // DCMS-447: the notifications reducer used to append unconditionally, so
    // a single failed `loadEntry` dispatch (occasionally invoked more than
    // once for one navigation, e.g. under React StrictMode) could stack
    // duplicate identical "Failed to load entry" toasts. The reducer now
    // dedups by (type, message) before appending.
    await gotoRoute(page, '/collections/posts/entries/does-not-exist-slug');

    const notificationRegion = page.getByRole('region', { name: /notification/i });
    await expect(notificationRegion).toContainText(/Failed to load entry/i);

    // DCMS-809: high-priority (error) toasts no longer carry role="alert" on
    // the visible node — Base UI's ToastViewport mounts a separate hidden
    // role="alert" announcer as a SIBLING of the role="region" viewport (not
    // a descendant of it), so the query must not be scoped inside
    // `notificationRegion`. `getByRole` also excludes elements hidden from
    // the accessibility tree by default, hence `includeHidden: true`.
    await expect(page.getByRole('alert', { includeHidden: true })).toHaveCount(1);
  });
});
