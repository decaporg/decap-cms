import { createPlateEditor, ParagraphPlugin } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { createEditorComponent } from '@/widgets/richtext/editorComponents';
import imageEditorComponent from '@/widgets/richtext/imageEditorComponent';
import ListPlugin from '@/widgets/richtext/RichtextControl/plugins/ListPlugin';
import ShortcodePlugin from '@/widgets/richtext/RichtextControl/plugins/ShortcodePlugin';
import { markdownToSlate, slateToMarkdown } from '@/widgets/richtext/serializers/index';

import type { EditorComponentsRegistry } from '@/widgets/richtext/types';

// decaporg #7896: an image block inside a list item must survive the editor's
// normalization and serialize back unchanged.
describe('list items with block images', () => {
  it('preserves a block image inside a list item', () => {
    const markdown = `1. First step.
2. Last step.

   ![Screenshot](/img/screenshot.png)`;
    const editorComponents: EditorComponentsRegistry = new Map([
      ['image', createEditorComponent(imageEditorComponent)],
    ]);
    const value = markdownToSlate(markdown, { editorComponents });
    const editor = createPlateEditor({
      plugins: [ParagraphPlugin, ListPlugin, ShortcodePlugin],
      shouldNormalizeEditor: true,
      value: value as any,
    });

    expect(slateToMarkdown(editor.children as any, {}, editorComponents)).toEqual(markdown);
  });
});
