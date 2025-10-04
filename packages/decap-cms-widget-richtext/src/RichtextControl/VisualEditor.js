import React from 'react';
import { usePlateEditor, Plate, ParagraphPlugin, PlateLeaf } from '@udecode/plate-common/react';
import { BoldPlugin, ItalicPlugin, CodePlugin } from '@udecode/plate-basic-marks/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { HEADING_KEYS } from '@udecode/plate-heading';
import { SoftBreakPlugin, ExitBreakPlugin } from '@udecode/plate-break/react';
import { ListPlugin } from '@udecode/plate-list/react';
import { LinkPlugin } from '@udecode/plate-link/react';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import { TrailingBlockPlugin } from '@udecode/plate-trailing-block';
import { ClassNames } from '@emotion/react';
import { fonts, lengths, zIndex } from 'decap-cms-ui-default';
import { fromJS } from 'immutable';

import { editorStyleVars } from '../styles';
import { markdownToSlate, slateToMarkdown } from '../serializers';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import ParagraphElement from './components/Element/ParagraphElement';
import withProps from './withProps';
import CodeLeaf from './components/Leaf/CodeLeaf';
import HeadingElement from './components/Element/HeadingElement';
import ListElement from './components/Element/ListElement';
import BlockquoteElement from './components/Element/BlockquoteElement';
import LinkElement from './components/Element/LinkElement';
import BlockquoteExtPlugin from './plugins/BlockquoteExtPlugin';
import ShortcodePlugin from './plugins/ShortcodePlugin';
// import ShortcodeElement from './components/Element/ShortcodeElement';

function visualEditorStyles({ minimal }) {
  return `
  position: relative;
  overflow: auto;
  font-family: ${fonts.primary};
  min-height: ${minimal ? 'auto' : lengths.richTextEditorMinHeight};
  margin-top: -${editorStyleVars.stickyDistanceBottom};
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: ${zIndex.zIndex100};
  white-space: pre-wrap;
`;
}

function mergeMediaConfig(editorComponents, field) {
  // merge editor media library config to image components
  if (editorComponents.has('image')) {
    const imageComponent = editorComponents.get('image');
    const fields = imageComponent?.fields;

    if (fields) {
      imageComponent.fields = fields.update(
        fields.findIndex(f => f.get('widget') === 'image'),
        f => {
          // merge `media_library` config
          if (field.has('media_library')) {
            f = f.set(
              'media_library',
              field.get('media_library').mergeDeep(f.get('media_library')),
            );
          }
          // merge 'media_folder'
          if (field.has('media_folder') && !f.has('media_folder')) {
            f = f.set('media_folder', field.get('media_folder'));
          }
          // merge 'public_folder'
          if (field.has('public_folder') && !f.has('public_folder')) {
            f = f.set('public_folder', field.get('public_folder'));
          }
          return f;
        },
      );
    }
  }
}

const emptyValue = [
  {
    id: '1',
    type: ParagraphPlugin.key,
    children: [{ text: '' }],
  },
];

export default function VisualEditor(props) {
  const { t, field, className, isDisabled, onChange, getEditorComponents } = props;

  let editorComponents = getEditorComponents();
  const codeBlockComponent = fromJS(editorComponents.find(({ type }) => type === 'code-block'));

  editorComponents =
    codeBlockComponent || editorComponents.has('code-block')
      ? editorComponents
      : editorComponents.set('code-block', { label: 'Code Block', type: 'code-block' });

  mergeMediaConfig(editorComponents, field);

  function handleBlockClick() {
    console.log('handleBlockClick');
  }

  function handleLinkClick() {
    console.log('handleLinkClick');
  }

  function handleToggleMode() {
    console.log('handleToggleMode');
  }

  function handleChange({ value }) {
    console.log('handleChange', value);
    const mdValue = slateToMarkdown(value, {}, editorComponents);
    onChange(mdValue);
  }

  const initialValue = props.value ? markdownToSlate(props.value, {}) : emptyValue;

  const editor = usePlateEditor({
    override: {
      components: {
        [BoldPlugin.key]: withProps(PlateLeaf, { as: 'b' }),
        [CodePlugin.key]: CodeLeaf,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
        [ParagraphPlugin.key]: ParagraphElement,
        [BlockquotePlugin.key]: BlockquoteElement,
        [LinkPlugin.key]: LinkElement,
        [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
        [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
        [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
        [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
        [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
        [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
        ['ul']: withProps(ListElement, { variant: 'ul' }),
        ['ol']: withProps(ListElement, { variant: 'ol' }),
        ['li']: withProps(ListElement, { variant: 'li' }),
      },
    },
    plugins: [
      ParagraphPlugin,
      HeadingPlugin,
      BoldPlugin,
      ItalicPlugin,
      CodePlugin,
      ListPlugin,
      LinkPlugin,
      BlockquotePlugin,
      BlockquoteExtPlugin,
      ShortcodePlugin,
      TrailingBlockPlugin.configure({
        options: { type: 'p' },
      }),
      SoftBreakPlugin.configure({
        rules: [
          { hotkey: 'shift+enter' },
          {
            hotkey: 'enter',
            query: {
              allow: [BlockquotePlugin.key],
            },
          },
        ],
      }),
      ExitBreakPlugin.configure({
        options: {
          rules: [
            {
              hotkey: 'mod+enter',
            },
            {
              hotkey: 'mod+shift+enter',
              before: true,
            },
            {
              hotkey: 'enter',
              query: {
                start: true,
                end: true,
                allow: Object.values(HEADING_KEYS),
              },
              relative: true,
              level: 1,
            },
          ],
        },
      }),
    ],
    value: initialValue,
  });

  return (
    <ClassNames>
      {({ css, cx }) => (
        <div
          className={cx(
            className,
            css`
              ${visualEditorStyles({ minimal: field.get('minimal') })}
            `,
          )}
        >
          <Plate editor={editor} onChange={handleChange}>
            <Toolbar
              onBlockClick={handleBlockClick}
              onLinkClick={handleLinkClick}
              onToggleMode={handleToggleMode}
              buttons={[]}
              editorComponents={editorComponents}
              allowedEditorComponents={field.get('editor_components')}
              onAddAsset={() => false}
              getAsset={() => false}
              hasInline={() => false}
              hasBlock={() => false}
              hasQuote={() => false}
              hasListItems={() => false}
              isShowModeToggle={() => false}
              onChange={() => false}
              t={t}
              disabled={isDisabled}
            />
            <Editor isDisabled={isDisabled} />
          </Plate>
        </div>
      )}
    </ClassNames>
  );
}
