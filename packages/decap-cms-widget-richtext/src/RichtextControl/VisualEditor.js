import React from 'react';
import { KEYS } from 'platejs';
import { usePlateEditor, Plate, ParagraphPlugin, PlateLeaf } from 'platejs/react';
import { BoldPlugin, ItalicPlugin, CodePlugin, HeadingPlugin } from '@platejs/basic-nodes/react';
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
import defaultEmptyBlock from './defaultEmptyBlock';

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

  function handleLinkClick() {
    console.log('handleLinkClick');
  }

  function handleToggleMode() {
    onMode('raw');
  }

  function handleChange({ value }) {
    // console.log('handleChange', value);
    const mdValue = slateToMarkdown(value, {}, editorComponents);
    onChange(mdValue);
  }

  const initialValue = props.value
    ? markdownToSlate(props.value, { editorComponents })
    : emptyValue;

  const editor = usePlateEditor({
    override: {
      components: {
        [BoldPlugin.key]: withProps(PlateLeaf, { as: 'b' }),
        [CodePlugin.key]: CodeLeaf,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
        [ParagraphPlugin.key]: ParagraphElement,
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
      HeadingPlugin,
      BoldPlugin,
      ItalicPlugin,
      CodePlugin,
      ListPlugin,
      LinkPlugin.configure({
        node: { component: LinkElement },
      }),
      ExtendedBlockquotePlugin.configure({
        node: { component: BlockquoteElement },
      }),
      ShortcodePlugin,
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
                onAddAsset={() => false} // investinagte
                getAsset={() => false} // investigate
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
