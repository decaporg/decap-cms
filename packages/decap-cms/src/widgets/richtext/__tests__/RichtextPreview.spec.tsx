import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import RichtextPreview from '@/widgets/richtext/RichtextPreview';

import type { RichtextField } from '@/widgets/richtext/types';

function renderPreview(value: string, field?: Partial<RichtextField>) {
  return render(
    <RichtextPreview
      value={value}
      getAsset={vi.fn()}
      resolveWidget={vi.fn()}
      field={field as RichtextField}
    />,
  );
}

describe('RichtextPreview HTML sanitization', () => {
  it('sanitizes HTML by default', () => {
    const { container } = renderPreview(`<img src="foobar.png" onerror="alert('hello')">`);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'foobar.png');
    expect(img).not.toHaveAttribute('onerror');
  });

  it('strips dangerous link protocols', () => {
    const { container } = renderPreview('<a href="javascript:alert(1)">click</a>');

    expect(container.querySelector('a')).not.toHaveAttribute('href');
  });

  it('leaves HTML alone when sanitize_preview is false', () => {
    const { container } = renderPreview(`<img src="foobar.png" onerror="alert('hello')">`, {
      sanitize_preview: false,
    });

    expect(container.querySelector('img')).toHaveAttribute('onerror', "alert('hello')");
  });

  // decaporg #7873: images picked but not yet committed preview from a blob: URL.
  it('keeps a same-origin blob: URL on <img src>', () => {
    const blobUrl = `blob:${window.location.origin}/1234-5678-90ab`;
    const { container } = renderPreview(`<img src="${blobUrl}">`, { sanitize_preview: true });

    expect(container.querySelector('img')).toHaveAttribute('src', blobUrl);
  });

  it('still strips blob: URLs from attributes other than <img src>', () => {
    const blobUrl = `blob:${window.location.origin}/should-be-stripped`;
    const { container } = renderPreview(
      `<a href="${blobUrl}">click</a><form action="${blobUrl}"></form>`,
      { sanitize_preview: true },
    );

    expect(container.querySelector('a')).not.toHaveAttribute('href');
    expect(container.querySelector('form')).not.toHaveAttribute('action');
  });

  it('strips a cross-origin blob: URL even on <img src>', () => {
    const { container } = renderPreview('<img src="blob:https://attacker.example/1234-5678-90ab">', {
      sanitize_preview: true,
    });

    expect(container.querySelector('img')).not.toHaveAttribute('src');
  });

  it('does not leave the blob: exception installed after rendering', async () => {
    renderPreview('<p>first render</p>');
    const { default: DOMPurify } = await import('dompurify');
    const blobUrl = `blob:${window.location.origin}/after-render`;

    expect(DOMPurify.sanitize(`<img src="${blobUrl}">`)).toBe('<img>');
  });
});
