import { authedTest as test, expect, gotoRoute } from './fixtures';

test.describe('collection controls', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, '/collections/posts');
  });

  test('lists entries with a create action', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible();
    await expect(page.getByRole('link', { name: /New Post/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /This is post #/ })).not.toHaveCount(0);
  });

  test('sort menu offers the configured sortable fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sort by' }).click();

    for (const field of ['Title', 'Publish Date']) {
      await expect(page.getByRole('menuitem', { name: field })).toBeVisible();
    }
  });

  test('filter menu offers the configured view filters', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter by' }).click();

    // Filter entries are checkable, so Base UI exposes them as
    // menuitemcheckbox rather than plain menuitem.
    for (const filter of ['Posts With Index', 'Posts Without Index', 'Relation Test']) {
      await expect(page.getByRole('menuitemcheckbox', { name: filter })).toBeVisible();
    }
  });

  test('group menu offers the configured view groups', async ({ page }) => {
    await page.getByRole('button', { name: 'Group by' }).click();

    for (const group of ['Year', 'Relation Test']) {
      await expect(page.getByRole('menuitem', { name: group })).toBeVisible();
    }

    // The demo dropped its front-matter `draft` field (decaporg #7865): drafts
    // are what the editorial workflow is for.
    await expect(page.getByRole('menuitem', { name: 'Drafts' })).not.toBeVisible();
  });

  test('New Post opens the create form', async ({ page }) => {
    await page.getByRole('link', { name: /New Post/i }).click();

    await expect(page).toHaveURL(/#\/collections\/posts\/new$/);
    await expect(page.getByLabel('Title').first()).toBeVisible();
  });
});

test.describe('restaurants collection', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, '/collections/restaurants');
  });

  // Regression guard for DCMS-2084 (#2086): the `summary`/`slug` templates
  // reference {{year}}/{{month}}/{{day}} tokens that silently drop when the
  // collection has no `date` field, rendering the literal separator with two
  // empty segments instead of a real date.
  test('code-cafe row renders a populated summary, not empty date tokens', async ({ page }) => {
    const row = page.getByRole('link', { name: /Code Cafe/i });
    await expect(row).toBeVisible();

    const summary = (await row.textContent()) ?? '';
    expect(summary).not.toContain('-- //');
    expect(summary.trim()).not.toMatch(/--\s*$/);
  });
});
