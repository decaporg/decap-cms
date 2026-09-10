import { act, fireEvent, render, screen } from '@testing-library/react';
import { Map } from 'immutable';
import { createEditor, Transforms } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';

import { getEditorComponents } from '../../index';
import withShortcodes from '../../plugins/shortcodes/withShortcodes';
import InlineShortcode from '../InlineShortcode';

jest.mock('../../index', () => ({
  getEditorComponents: jest.fn(),
}));

describe('InlineShortcode', () => {
  it('should not update another node when the edited node is deleted', async () => {
    let resolveEdit;
    const onEdit = jest.fn(
      () =>
        new Promise(resolve => {
          resolveEdit = resolve;
        }),
    );
    getEditorComponents.mockReturnValue(
      Map({
        wikilink: {
          id: 'wikilink',
          onEdit,
          toPreview: data => data.target,
        },
      }),
    );

    const editor = withReact(withShortcodes(createEditor()));
    const initialValue = [
      {
        type: 'paragraph',
        children: [
          { text: '' },
          {
            type: 'inline-shortcode',
            data: { shortcode: 'wikilink', shortcodeData: { target: 'first' } },
            children: [{ text: '' }],
          },
          { text: ' ' },
          {
            type: 'inline-shortcode',
            data: { shortcode: 'wikilink', shortcodeData: { target: 'second' } },
            children: [{ text: '' }],
          },
          { text: '' },
        ],
      },
    ];

    render(
      <Slate editor={editor} initialValue={initialValue}>
        <Editable
          renderElement={props =>
            props.element.type === 'inline-shortcode' ? (
              <InlineShortcode {...props} />
            ) : (
              <p {...props.attributes}>{props.children}</p>
            )
          }
        />
      </Slate>,
    );

    fireEvent.click(screen.getByText('first'));
    await act(async () => {
      Transforms.removeNodes(editor, { at: [0, 1] });
      resolveEdit({ target: 'updated' });
      await Promise.resolve();
    });

    const remainingInline = editor.children[0].children.find(
      child => child.type === 'inline-shortcode',
    );
    expect(remainingInline.data.shortcodeData).toEqual({ target: 'second' });
  });
});
