import { authedTest as test, expect, gotoRoute } from './fixtures';

/**
 * decaporg #7956 — edits to a list item must land on the item they were made
 * in, even after earlier items are removed or the list is reordered.
 */
test.describe('list widget', () => {
  test('edits keep landing on the right item after a remove and a reorder', async ({ page }) => {
    await gotoRoute(page, '/collections/kitchenSink');
    await page.getByRole('link', { name: /New Kitchen Sink/i }).click();
    await expect(page).toHaveURL(/#\/collections\/kitchenSink\/new$/);

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Add typed list/i }).click();
      await page.getByRole('menuitem', { name: 'Type 1 Object' }).click();
    }
    const strings = page.getByRole('textbox', { name: /^string$/i });
    await expect(strings).toHaveCount(3);
    await strings.nth(0).fill('one');
    await strings.nth(1).fill('two');
    await strings.nth(2).fill('three');

    async function typeAtEnd(index: number, text: string) {
      await strings.nth(index).click();
      await page.keyboard.press('End');
      await page.keyboard.type(text);
    }

    // Remove the first typed-list item; the typed list is the last list on
    // the page, so its Remove buttons are the last three.
    const removes = page.getByRole('button', { name: 'Remove', exact: true });
    await removes.nth((await removes.count()) - 3).click();
    await expect(strings).toHaveCount(2);
    await expect(strings.nth(0)).toHaveValue('two');
    await expect(strings.nth(1)).toHaveValue('three');

    await typeAtEnd(1, ' edited');
    await expect(strings.nth(0)).toHaveValue('two');
    await expect(strings.nth(1)).toHaveValue('three edited');

    // Move the first item down with the keyboard reorder handle.
    await page.getByRole('button', { name: /Reorder item, position 1 of 2/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(strings.nth(0)).toHaveValue('three edited');
    await expect(strings.nth(1)).toHaveValue('two');

    await typeAtEnd(1, ' again');
    await expect(strings.nth(0)).toHaveValue('three edited');
    await expect(strings.nth(1)).toHaveValue('two again');
  });
});
