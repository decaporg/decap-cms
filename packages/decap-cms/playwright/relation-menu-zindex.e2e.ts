import { authedTest as test, expect, gotoRoute } from './fixtures';

/**
 * Regression for DCMS-2138: opening the relation widget's option menu above
 * a richtext widget used to leave the richtext widget's sticky toolbar
 * (the `position: sticky` wrapper around `Toolbar.tsx`, which carries its
 * own explicit z-index) painted on top of the menu's lower rows.
 *
 * Root cause: `ComboboxPositioner` (the floating element `Combobox.tsx`
 * portals to `document.body`) is `position: absolute`/`fixed` with
 * `z-index: auto`. Per the CSS painting-order algorithm, a positioned
 * descendant with `z-index: auto` paints in the same step - ordered by DOM
 * position, not visual nesting - as any other stacking context establishing
 * `z-index: auto`/`0` element elsewhere in the document, including a sibling
 * `position: sticky` element with its own explicit `z-index` (the richtext
 * toolbar's wrapper). `ComboboxPopup`'s own `z-index: 50` only wins against
 * its siblings *within* the Positioner - it did nothing for stacking against
 * that unrelated tree. Fixed by giving `ComboboxPositioner` itself an
 * explicit z-index, which promotes the whole floating tree into the
 * "positive z-index" painting step that always wins over `z-index: auto`
 * content irrespective of DOM order.
 */
test.describe('relation widget menu vs richtext sticky toolbar (DCMS-2138)', () => {
  test('every option row in an open relation menu renders above a sibling richtext sticky toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await gotoRoute(page, '/collections/kitchenSink');
    await page.getByRole('link', { name: /New Kitchen Sink/i }).click();
    await expect(page).toHaveURL(/#\/collections\/kitchenSink\/new$/);

    // Type until the option list fills the menu (matches the issue's
    // "kitchenSink" repro: a "Related Post" relation field sits directly
    // above the "Markdown" richtext field, whose sticky toolbar is the one
    // that used to bleed through).
    const input = page.getByLabel('Related Post').first();
    await input.click();
    await input.fill('post');

    const lastOption = page.getByRole('option', { name: /This is post # 1$/ });
    await expect(lastOption).toBeVisible();

    // The richtext toolbar container: the Bold button's toolbar row. A CSS
    // locator, because the open combobox hides the rest of the page from the
    // accessibility tree, so role queries can't reach the toolbar.
    const toolbar = page.locator('button[title="Bold"]').first().locator('xpath=../..');
    await expect(toolbar).toBeVisible();

    // The two elements' boxes must actually overlap for this assertion to be
    // meaningful - otherwise a future layout change could make this test
    // pass for the wrong reason. Compute the actual overlap rectangle (not
    // just each box's own center - the option row is taller than the sliver
    // the toolbar overlaps, so sampling the option's own center can land
    // outside the contested region and silently pass regardless of the fix).
    const optionBox = (await lastOption.boundingBox())!;
    const toolbarBox = (await toolbar.boundingBox())!;
    const overlapTop = Math.max(optionBox.y, toolbarBox.y);
    const overlapBottom = Math.min(optionBox.y + optionBox.height, toolbarBox.y + toolbarBox.height);
    expect(overlapBottom).toBeGreaterThan(overlapTop);
    const overlapY = (overlapTop + overlapBottom) / 2;

    // Hit-test the left, center, and right of the actual overlap sliver:
    // each point must resolve to the option (or a descendant of it), never
    // to the toolbar's chrome.
    const points: Array<[number, number]> = [
      [optionBox.x + 4, overlapY],
      [optionBox.x + optionBox.width / 2, overlapY],
      [optionBox.x + optionBox.width - 4, overlapY],
    ];

    for (const [x, y] of points) {
      const hitsOption = await page.evaluate(
        ([px, py]) => {
          const el = document.elementFromPoint(px, py);
          return !!el?.closest('[data-slot="combobox-item"]');
        },
        [x, y],
      );
      expect(hitsOption).toBe(true);
    }
  });
});
