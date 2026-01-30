import React, { useEffect } from 'react';
import { KEYS } from 'platejs';
import { usePlateEditor, Plate, ParagraphPlugin, PlateLeaf } from 'platejs/react';
import {
  BoldPlugin,
  ItalicPlugin,
  CodePlugin,
  HeadingPlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list-classic/react';
import { LinkPlugin } from '@platejs/link/react';
import { ClassNames, css } from '@emotion/react';
import { fonts, lengths, zIndex } from 'decap-cms-ui-default';
import { fromJS } from 'immutable';

import { editorContainerStyles, EditorControlBar, editorStyleVars } from '../styles';
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
import ExtendedBlockquotePlugin from './plugins/ExtendedBlockquotePlugin';
import ShortcodePlugin from './plugins/ShortcodePlugin';
import { TablePlugin, TableRowPlugin, TableCellPlugin } from './plugins/TablePlugin';
import defaultEmptyBlock from './defaultEmptyBlock';
import { mergeMediaConfig } from './mergeMediaConfig';
import { handleLinkClick } from './linkHandler';

function editorStyles({ minimal }) {
  return css`
    position: relative;
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

const emptyValue = [defaultEmptyBlock()];

export default function VisualEditor(props) {
  const {
    t,
    field,
    className,
    isDisabled,
    onMode,
    isShowModeToggle,
    onChange,
    getEditorComponents,
  } = props;

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

  function handleToggleMode() {
    onMode('raw');
  }

  function handleChange({ value }) {
    // console.log('handleChange', value);
    const mdValue = slateToMarkdown(
      value,
      { voidCodeBlock: !!codeBlockComponent },
      editorComponents,
    );
    onChange(mdValue);
  }

  const initialValue = props.value
    ? markdownToSlate(props.value, { editorComponents, voidCodeBlock: !!codeBlockComponent })
    : emptyValue;

  const editor = usePlateEditor({
    override: {
      components: {
        [BoldPlugin.key]: withProps(PlateLeaf, { as: 'b' }),
        [CodePlugin.key]: CodeLeaf,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
        [ParagraphPlugin.key]: withProps(ParagraphElement, { as: 'p' }),
        [KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
        [KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
        [KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
        [KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
        [KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
        [KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
        ['ul']: withProps(ListElement, { variant: 'ul' }),
        ['ol']: withProps(ListElement, { variant: 'ol' }),
        ['li']: withProps(ListElement, { variant: 'li' }),
      },
    },
    plugins: [
      ParagraphPlugin,
      HeadingPlugin.configure({
        shortcuts: {
          h1: { keys: 'mod+1', handler: () => editor.tf.toggleBlock('h1') },
          h2: { keys: 'mod+2', handler: () => editor.tf.toggleBlock('h2') },
          h3: { keys: 'mod+3', handler: () => editor.tf.toggleBlock('h3') },
          h4: { keys: 'mod+4', handler: () => editor.tf.toggleBlock('h4') },
          h5: { keys: 'mod+5', handler: () => editor.tf.toggleBlock('h5') },
          h6: { keys: 'mod+6', handler: () => editor.tf.toggleBlock('h6') },
        },
      }),
      BoldPlugin,
      ItalicPlugin,
      StrikethroughPlugin.configure({
        shortcuts: { toggle: { keys: 'mod+shift+s' } },
      }),
      CodePlugin.configure({
        shortcuts: { toggle: { keys: 'mod+shift+c' } },
      }),
      ListPlugin,
      LinkPlugin.configure({
        node: { component: LinkElement },
        shortcuts: {
          toggleLink: {
            keys: 'mod+k',
            handler: () => {
              handleLinkClick({ editor, t });
            },
          },
        },
      }),
      ExtendedBlockquotePlugin.configure({
        node: { component: BlockquoteElement },
      }),
      ShortcodePlugin,
      TablePlugin,
      TableRowPlugin,
      TableCellPlugin,
    ],
    value: initialValue,
  });

  useEffect(() => {
    if (props.pendingFocus) {
      editor.tf.focus({ edge: 'endEditor' });
      props.pendingFocus();
    }
  }, [props.pendingFocus]);

  return (
    <ClassNames>
      {({ css, cx }) => (
        <div
          className={cx(
            className,
            css`
              ${editorContainerStyles}
            `,
          )}
        >
          <Plate editor={editor} onChange={handleChange}>
            <EditorControlBar>
              <Toolbar
                onBlockClick={handleBlockClick}
                onLinkClick={handleLinkClick}
                onToggleMode={handleToggleMode}
                buttons={[]}
                editorComponents={editorComponents}
                allowedEditorComponents={field.get('editor_components')}
                isShowModeToggle={isShowModeToggle}
                t={t}
                disabled={isDisabled}
              />
            </EditorControlBar>
            <div css={editorStyles({ minimal: field.get('minimal') })}>
              <Editor isDisabled={isDisabled} />
            </div>
          </Plate>
        </div>
      )}
    </ClassNames>
  );
}
