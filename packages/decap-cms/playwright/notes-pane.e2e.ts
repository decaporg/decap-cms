import { authedTest as test, expect, gotoRoute } from './fixtures';

/**
 * decaporg #7563 / #7994: the editor's notes pane. The demo's FAQ collection
 * enables `editor.notes`; the test backend keeps notes in memory.
 */
test.describe('notes pane', () => {
  test('adds, edits, resolves and deletes a note on a saved entry', async ({ page }) => {
    await gotoRoute(page, '/collections/faq');
    await page.getByRole('link', { name: /This FAQ item #/ }).first().click();
    await expect(page).toHaveURL(/#\/collections\/faq\/entries\//);

    const pane = page.getByRole('complementary', { name: 'Notes' });
    // Notes are the first pane a FAQ entry offers (no second locale).
    await expect(pane).toBeVisible();
    await expect(pane.getByText('No notes yet.', { exact: false })).toBeVisible();

    await pane.getByRole('textbox', { name: 'Add a note...' }).fill('Check the second paragraph');
    await pane.getByRole('button', { name: 'Add Note' }).click();
    const note = pane.getByTestId('note-item');
    await expect(note).toContainText('Check the second paragraph');
    await expect(page.getByRole('region', { name: /notification/i })).toContainText('Note added');

    await note.getByRole('button', { name: 'Edit' }).click();
    const editBox = note.getByRole('textbox', { name: 'Edit your note...' });
    await editBox.fill('Check the third paragraph');
    await note.getByRole('button', { name: 'Save' }).click();
    await expect(note).toContainText('Check the third paragraph');

    await note.getByRole('button', { name: 'Resolve' }).click();
    await expect(note).toContainText('Resolved');
    await expect(note.getByRole('button', { name: 'Unresolve' })).toBeVisible();

    await note.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(pane.getByTestId('note-item')).toHaveCount(0);
  });

  test('keeps notes when reopening the entry and toggles with the view control', async ({ page }) => {
    await gotoRoute(page, '/collections/faq');
    await page.getByRole('link', { name: /This FAQ item #/ }).first().click();
    const pane = page.getByRole('complementary', { name: 'Notes' });
    await pane.getByRole('textbox', { name: 'Add a note...' }).fill('Persisted note');
    await pane.getByRole('button', { name: 'Add Note' }).click();
    await expect(pane.getByTestId('note-item')).toHaveCount(1);

    // Switch to the preview and back.
    await page.getByRole('button', { name: 'Toggle preview' }).click();
    await expect(pane).toHaveCount(0);
    await page.getByRole('button', { name: 'Toggle notes' }).click();
    await expect(page.getByRole('complementary', { name: 'Notes' }).getByTestId('note-item')).toHaveCount(1);

    // Leave and come back: the note is loaded again.
    await page.getByRole('link', { name: /Writing in FAQ collection/ }).click();
    await page.getByRole('link', { name: /This FAQ item #/ }).first().click();
    await expect(page.getByRole('complementary', { name: 'Notes' }).getByTestId('note-item')).toContainText(
      'Persisted note',
    );
  });

  test('is not offered on a new entry', async ({ page }) => {
    await gotoRoute(page, '/collections/faq');
    await page.getByRole('link', { name: /New FAQ/i }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Toggle notes' })).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Notes' })).toHaveCount(0);
  });
});
