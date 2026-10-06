import { authedTest as test, expect, gotoRoute } from './fixtures';

import type { Page } from '@playwright/test';

/**
 * DCMS-2134 — the view-controls icon column (`EditorInterface`'s
 * `ViewControls`) is absolutely positioned in the top-right corner of the
 * editor, with a z-index above the preview iframe. It reserved no layout
 * space, so any preview content that wrapped into that same corner — e.g. a
 * very long entry title's `<h1>` — rendered *underneath* it and was visually
 * clipped.
 *
 * `EditorInterface` now measures the overlay's real footprint and forwards
 * it to the preview iframe (`EditorPreviewContent`) as `chromeReserve`,
 * which renders a right-floated, zero-content spacer ahead of the actual
 * preview markup — the same mechanism that makes text wrap around a floated
 * image — so the wrapped text reserves that corner instead of running under
 * chrome that has no idea it's there.
 */

async function fillLongTitleAndOpenPreview(page: Page, title: string) {
  await gotoRoute(page, '/collections/posts');
  await page.getByRole('link', { name: /New Post/i }).click();
  await expect(page).toHaveURL(/#\/collections\/posts\/new$/);

  await page.getByLabel('Title').first().fill(title);

  const previewFrame = page.frameLocator('#preview-pane');
  const heading = previewFrame.locator('h1').first();
  await expect(heading).toBeVisible();
  return heading;
}

/**
 * The point painted at page coordinates `(x, y)` — via the *top-level*
 * `document.elementFromPoint`, which does not pierce into the (same-origin)
 * preview iframe, so a point over unobstructed preview content resolves to
 * the `<iframe id="preview-pane">` itself. If the assistant pill or a
 * view-controls icon button is on top instead, `elementFromPoint` resolves
 * to that control, not the iframe.
 */
function topmostElementAt(page: Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      return el
        ? { id: el.id, tag: el.tagName, testId: el.getAttribute('data-testid') }
        : null;
    },
    [x, y] as [number, number],
  );
}

test.describe('Preview pane chrome overlay does not clip wrapped content (DCMS-2134)', () => {
  test("no wrapped line of a 2000-char title's <h1> runs under the view-controls chrome", async ({ page }) => {
    const heading = await fillLongTitleAndOpenPreview(page, 'X'.repeat(2000));

    const frameBox = await page.locator('#preview-pane').boundingBox();
    expect(frameBox).not.toBeNull();
    if (!frameBox) return;

    // Each wrapped line's client rect (from a `Range` over the heading's
    // text), in the iframe's own coordinates. Lines next to the controls
    // are deliberately shorter: the `chromeReserve` float pushes them in.
    const lines = await heading.evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return Array.from(range.getClientRects()).map(r => ({ right: r.right, top: r.top, height: r.height }));
    });
    expect(lines.length).toBeGreaterThan(2);

    // Probe the last character of every on-screen line: the topmost element
    // there must be the preview iframe, never a view-controls button painted
    // over it. (`elementFromPoint` returns null off-screen.)
    const viewportHeight = page.viewportSize()?.height ?? 0;
    const visibleLines = lines.filter(line => frameBox.y + line.top + line.height < viewportHeight);
    expect(visibleLines.length).toBeGreaterThan(2);
    for (const line of visibleLines) {
      const probeX = frameBox.x + line.right - 3;
      const probeY = frameBox.y + line.top + line.height / 2;
      const elementAtProbe = await topmostElementAt(page, probeX, probeY);
      expect(elementAtProbe?.id).toBe('preview-pane');
    }
  });

  test('special characters at the wrap boundary render fully visible on line 1', async ({ page }) => {
    // Matches the issue's adversarial repro string exactly: the wrap point
    // is the space between `</script>` and `"q"`.
    const title = 'Emoji \u{1F41B} & <script>alert(1)</script> "q" \'a\' \\ / `t`';
    const heading = await fillLongTitleAndOpenPreview(page, title);

    await expect(heading).toContainText('</script>');

    // Locate the end of `</script>` within the heading's text node and probe
    // just past it — the exact character the issue's screenshot shows
    // truncated to `</scrip` under the assistant pill.
    const probe = await heading.evaluate(el => {
      const textNode = el.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;
      const text = textNode.textContent ?? '';
      const idx = text.indexOf('</script>');
      if (idx === -1) return null;
      const range = document.createRange();
      range.setStart(textNode, idx + '</script>'.length - 1);
      range.setEnd(textNode, idx + '</script>'.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.right - 2, y: rect.top + rect.height / 2 };
    });

    expect(probe).not.toBeNull();
    if (!probe) return;

    // Translate the iframe-local point into page coordinates: `boundingBox`
    // on any element inside the frame gives the iframe's own page offset.
    const frameOffset = await heading.boundingBox();
    expect(frameOffset).not.toBeNull();
    if (!frameOffset) return;
    const headingLocalRect = await heading.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    });

    const pageX = frameOffset.x + (probe.x - headingLocalRect.x);
    const pageY = frameOffset.y + (probe.y - headingLocalRect.y);

    const elementAtProbe = await topmostElementAt(page, pageX, pageY);
    expect(elementAtProbe?.id).toBe('preview-pane');
    expect(elementAtProbe?.tag).not.toBe('BUTTON');
  });
});
