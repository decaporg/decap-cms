import { authedTest as test, expect, gotoRoute } from './fixtures';

/**
 * DCMS-431 — the app-shell top-nav (`Contents`, `Workflow`, `Media`) used to
 * stay mounted underneath the entry editor's own toolbar: not
 * `display: none`, not `aria-hidden`, still `tabIndex`-focusable, but visually
 * painted over so every click/`elementFromPoint` at their on-screen position
 * landed on the editor toolbar instead.
 *
 * The app-shell header is unmounted entirely while an editor route
 * (`entryNew` / `entry`) is active, so these specs assert the header nav is
 * gone from the DOM (not just hidden) whenever the editor toolbar is up, and
 * comes back the moment the editor is left.
 */
const contentsLink = (page: import('@playwright/test').Page) =>
  page.getByRole('banner').getByRole('link', { name: 'Contents', exact: true });
const mediaButton = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Media', exact: true });
const backLink = (page: import('@playwright/test').Page) =>
  page.getByRole('link', { name: /Writing in Posts collection/ });

test.describe('editor route - app top-nav suppression', () => {
  test('opening an existing entry removes the app header, not just covers it', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');

    // Sanity: the app header's "Contents" link and "Media" button are real,
    // clickable elements before entering the editor.
    await expect(contentsLink(page)).toBeVisible();
    await expect(mediaButton(page)).toBeVisible();

    await page.getByRole('link', { name: /This is post #/ }).first().click();
    await expect(page).toHaveURL(/#\/collections\/posts\/entries\//);

    // The editor's own toolbar is up …
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

    // … and the app header is gone from the DOM entirely, so there is
    // nothing left to tab-focus or mis-click into.
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(mediaButton(page)).toHaveCount(0);

    // Leaving the editor restores the header.
    await backLink(page).click();
    await expect(contentsLink(page)).toBeVisible();
  });

  /**
   * DCMS-1651 — the editor toolbar's link back to the collection must stay
   * clickable after a save: nothing from the app layout (header or sidebar)
   * may sit underneath the editor toolbar and intercept the click.
   */
  test('the back link survives a save and navigates back to the collection', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
    // An existing entry already has every required field filled (Body
    // included), so a title edit is a clean, guaranteed-valid save — unlike
    // a brand-new entry, which needs Body/Draft/Publish Date filled in too
    // before Save clears validation.
    await page.getByRole('link', { name: /This is post #/ }).first().click();
    await expect(page).toHaveURL(/#\/collections\/posts\/entries\//);

    // Let the Body richtext editor finish mounting/hydrating its existing
    // content before touching Title — editing too early races a
    // late-mounting editor and can leave Body looking empty/required at save
    // time, unrelated to the behaviour under test.
    await page.locator('[contenteditable="true"][data-slate-editor="true"]').first()
      .locator(':scope > *').first().waitFor();

    await page.getByLabel('Title').first().fill('DCMS-1651 back link regression check');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Changes saved')).toBeVisible();

    // A single click must land on the link and navigate — not get
    // intercepted by a sibling overlay.
    await backLink(page).click({ timeout: 10000 });

    await expect(page).toHaveURL(/#\/collections\/posts$/);
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
  });

  test('the new-entry editor route also removes the app header', async ({ page }) => {
    // Reach the route by navigating there from a page that does have the
    // header, so the assertion is meaningful.
    await gotoRoute(page, '/collections/posts');
    await expect(contentsLink(page)).toBeVisible();
    await page.getByRole('link', { name: /New Post/i }).click();
    await expect(page).toHaveURL(/#\/collections\/posts\/new$/);

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(mediaButton(page)).toHaveCount(0);
  });

  test('tabbing from the editor never focuses a removed app-header control', async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
    await expect(contentsLink(page)).toBeVisible();
    await page.getByRole('link', { name: /New Post/i }).click();
    await expect(page).toHaveURL(/#\/collections\/posts\/new$/);
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

    // Neither control exists in the accessibility tree while editing, so they
    // cannot pick up focus via Tab.
    await expect(page.getByRole('link', { name: 'Contents', exact: true })).toHaveCount(0);
    await expect(mediaButton(page)).toHaveCount(0);
  });
});
