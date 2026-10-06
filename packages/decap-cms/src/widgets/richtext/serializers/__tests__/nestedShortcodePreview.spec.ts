import { describe, expect, it } from 'vitest';

import { createEditorComponent } from '@/widgets/richtext/editorComponents';
import imageEditorComponent from '@/widgets/richtext/imageEditorComponent';
import { markdownToHtml } from '@/widgets/richtext/serializers/index';

import type { EditorComponentsRegistry } from '@/widgets/richtext/types';

const editorComponents: EditorComponentsRegistry = new Map([
  ['image', createEditorComponent(imageEditorComponent)],
]);

// Resolve assets to a recognisable URL so the test can tell they went through it.
const getAsset = (path: string) => `https://cdn.example${path}`;

describe('shortcode previews', () => {
  it('renders a root-level shortcode', () => {
    const html = markdownToHtml('![Screenshot](/img/screenshot.png)', { editorComponents, getAsset });

    expect(html).toContain('src="https://cdn.example/img/screenshot.png"');
  });

  // decaporg #7898: shortcodes below the root (here an image block inside a
  // list item) were dropped from the preview.
  it('renders a shortcode nested inside a list item', () => {
    const markdown = `1. First step.
2. Last step.

   ![Screenshot](/img/screenshot.png)`;

    const html = markdownToHtml(markdown, { editorComponents, getAsset });

    expect(html).toContain('<li>');
    expect(html).toContain('src="https://cdn.example/img/screenshot.png"');
    expect(html).toContain('alt="Screenshot"');
  });
});
