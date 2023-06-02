// @refresh reset
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames, css as coreCss } from '@emotion/core';
import { lengths, fonts, zIndex } from 'netlify-cms-ui-default';
import styled from '@emotion/styled';
import { createEditor, Transforms, Editor as SlateEditor } from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { fromJS } from 'immutable';
import { debounce } from 'lodash';

import { editorStyleVars, EditorControlBar } from '../styles';
import Toolbar from './Toolbar';
import { Element, Leaf } from './renderers';
import withLists from './plugins/lists/withLists';
import withBlocks from './plugins/blocks/withBlocks';
import withInlines from './plugins/inlines/withInlines';
import toggleMark from './plugins/inlines/events/toggleMark';
import toggleLink from './plugins/inlines/events/toggleLink';
import getActiveLink from './plugins/inlines/selectors/getActiveLink';
import isMarkActive from './plugins/inlines/locations/isMarkActive';
import isCursorInBlockType from './plugins/blocks/locations/isCursorInBlockType';
import { markdownToSlate, slateToMarkdown } from '../serializers';
import withShortcodes from './plugins/shortcodes/withShortcodes';
import insertShortcode from './plugins/shortcodes/insertShortcode';
import defaultEmptyBlock from './plugins/blocks/defaultEmptyBlock';

function visualEditorStyles({ minimal }) {
  return `
  position: relative;
  overflow: auto;
  font-family: ${fonts.primary};
  min-height: ${minimal ? 'auto' : lengths.richTextEditorMinHeight};
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: 0;
  margin-top: -${editorStyleVars.stickyDistanceBottom};
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: ${zIndex.zIndex100};
`;
}

const InsertionPoint = styled.div`
  flex: 1 1 auto;
  cursor: text;
`;
function Editor(props) {
  const {
    onAddAsset,
    getAsset,
    className,
    field,
    isShowModeToggle,
    t,
    isDisabled,
    getEditorComponents,
    getRemarkPlugins,
    onChange,
  } = props;

  const [editor] = useState(() =>
    withReact(withShortcodes(withBlocks(withLists(withInlines(createEditor()))))),
    );

  const emptyValue = [defaultEmptyBlock()];
  const [editorValue, setEditorValue] = useState(props.value ? markdownToSlate(props.value) : emptyValue);
  let editorComponents = getEditorComponents();
  const codeBlockComponent = fromJS(editorComponents.find(({ type }) => type === 'code-block'));

  editorComponents =
    codeBlockComponent || editorComponents.has('code-block')
      ? editorComponents
      : editorComponents.set('code-block', { label: 'Code Block', type: 'code-block' });

  const renderElement = useCallback(
    props => (
      <Element {...props} classNameWrapper={className} codeBlockComponent={codeBlockComponent} />
    ),
    [],
  );
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  useEffect(() => {
    if (props.pendingFocus) {
      ReactEditor.focus(editor);
    }
  }, []);

  function handleMarkClick(format) {
    ReactEditor.focus(editor);
    toggleMark(editor, format);
  }

  function handleBlockClick(format) {
    ReactEditor.focus(editor);
    if (format.endsWith('-list')) {
      editor.toggleList(format);
    } else {
      editor.toggleBlock(format);
    }
  }

  function handleLinkClick() {
    toggleLink(editor, t('editor.editorWidgets.markdown.linkPrompt'));
    ReactEditor.focus(editor);
  }

  function handleToggleMode() {
    props.onMode('raw');
  }

  function handleInsertShortcode(pluginConfig) {
    insertShortcode(editor, pluginConfig);
  }

  function handleKeyDown(event) {
    for (const handler of editor.keyDownHandlers || []) {
      if (handler(event, editor) === false) {
        break;
      }
    }
  }

  function handleClickBelowDocument() {
    ReactEditor.focus(editor);
    Transforms.select(editor, { path: [0, 0], offset: 0 });
    Transforms.select(editor, SlateEditor.end(editor, []));
  }
  const [toolbarKey, setToolbarKey] = useState(0);

  const handleDocumentChange = debounce((newValue) => {
    setEditorValue(newValue);
  }, 150);

  function handleChange(newValue) {
    handleDocumentChange(newValue);
    setToolbarKey(prev => prev + 1);
  }

  useEffect(() => {
    onChange(
      slateToMarkdown(editorValue, {
        voidCodeBlock: !!codeBlockComponent,
        remarkPlugins: getRemarkPlugins(),
      }),
    );
  }, [editorValue]);

  function hasMark(format) {
    return isMarkActive(editor, format);
  }

  function hasInline(format) {
    if (format == 'link') {
      return !!getActiveLink(editor);
    }
    return false;
  }

  function hasBlock(format) {
    return isCursorInBlockType(editor, format);
  }
  function hasQuote() {
    return isCursorInBlockType(editor, 'quote');
  }
  function hasListItems(type) {
    return isCursorInBlockType(editor, type);
  }

  return (
    <div
      css={coreCss`
        position: relative;
      `}
    >
      <Slate editor={editor} value={editorValue} onChange={handleChange}>
        <EditorControlBar>
          {
            <Toolbar
              key={toolbarKey}
              onMarkClick={handleMarkClick}
              onBlockClick={handleBlockClick}
              onLinkClick={handleLinkClick}
              onToggleMode={handleToggleMode}
              plugins={editorComponents}
              onSubmit={handleInsertShortcode}
              onAddAsset={onAddAsset}
              getAsset={getAsset}
              buttons={field.get('buttons')}
              editorComponents={field.get('editor_components')}
              hasMark={hasMark}
              hasInline={hasInline}
              hasBlock={hasBlock}
              hasQuote={hasQuote}
              hasListItems={hasListItems}
              isShowModeToggle={isShowModeToggle}
              t={t}
              disabled={isDisabled}
            />
          }
        </EditorControlBar>
        {
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
                {editorValue.length !== 0 && (
                  <Editable
                    className={css`
                      padding: 16px 20px 0;
                    `}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    onKeyDown={handleKeyDown}
                    autoFocus={false}
                  />
                )}
                <InsertionPoint onClick={handleClickBelowDocument} />
              </div>
            )}
          </ClassNames>
        }
      </Slate>
    </div>
  );
}

Editor.propTypes = {
  onAddAsset: PropTypes.func.isRequired,
  getAsset: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  value: PropTypes.string,
  field: ImmutablePropTypes.map.isRequired,
  getEditorComponents: PropTypes.func.isRequired,
  getRemarkPlugins: PropTypes.func.isRequired,
  isShowModeToggle: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
};

export default Editor;
