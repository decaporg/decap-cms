import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createEditorComponent } from '@/widgets/richtext/editorComponents';
import imageEditorComponent from '@/widgets/richtext/imageEditorComponent';

const image = createEditorComponent(imageEditorComponent);

describe('image editor component', () => {
  it('parses a markdown image with alt text and title', () => {
    const match = '![A cat](/media/cat.png "Sleeping cat")'.match(image.pattern)!;

    expect(image.fromBlock(match)).toEqual({
      image: '/media/cat.png',
      alt: 'A cat',
      title: 'Sleeping cat',
    });
  });

  it('parses a markdown image without alt text or title', () => {
    const match = '![](/media/cat.png)'.match(image.pattern)!;

    expect(image.fromBlock(match)).toEqual({ image: '/media/cat.png', alt: '', title: undefined });
  });

  it('serializes back to markdown, escaping quotes in the title', () => {
    expect(image.toBlock({ image: '/media/cat.png', alt: 'A cat', title: 'The "cat"' })).toBe(
      '![A cat](/media/cat.png "The \\"cat\\"")',
    );
    expect(image.toBlock({ image: '/media/cat.png' })).toBe('![](/media/cat.png)');
  });

  it('round-trips through toBlock and fromBlock', () => {
    const data = { image: '/media/cat.png', alt: 'A cat', title: 'Sleeping cat' };
    const markdown = image.toBlock(data);

    expect(image.fromBlock(markdown.match(image.pattern)!)).toEqual(data);
  });

  it('previews through getAsset with the image field', () => {
    const getAsset = vi.fn(() => 'blob:resolved-url');
    const preview = image.toPreview!(
      { image: '/media/cat.png', alt: 'A cat', title: 'Sleeping cat' },
      getAsset,
      image.fields,
    );
    const { container } = render(<>{preview}</>);

    expect(getAsset).toHaveBeenCalledWith('/media/cat.png', expect.objectContaining({ widget: 'image' }));
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'blob:resolved-url');
    expect(img).toHaveAttribute('alt', 'A cat');
    expect(img).toHaveAttribute('title', 'Sleeping cat');
  });

  it('previews the stored path when there is no getAsset', () => {
    const preview = image.toPreview!({ image: '/media/cat.png', alt: 'A cat' }, undefined, image.fields);
    const { container } = render(<>{preview}</>);

    expect(container.querySelector('img')).toHaveAttribute('src', '/media/cat.png');
  });
});
