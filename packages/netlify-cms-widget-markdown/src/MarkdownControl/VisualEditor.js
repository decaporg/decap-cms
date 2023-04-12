// @refresh reset
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames, css as coreCss } from '@emotion/core';
import { lengths, fonts, zIndex } from 'netlify-cms-ui-default';
import styled from '@emotion/styled';
import {
  createEditor,
  Transforms,
  Editor as SlateEditor,
  Element as SlateElement,
  Range,
  Node,
  Path,
} from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import isHotkey from 'is-hotkey';
import isUrl from 'is-url';
import { debounce, isEqual } from 'lodash';

import { editorStyleVars, EditorControlBar } from '../styles';
import Toolbar from './Toolbar';
import { Element, Leaf } from './renderers';
import { markdownToSlate, slateToMarkdown } from '../serializers';
import { flushSync } from 'react-dom';
import withLists from './plugins/lists/withLists';
import withBlocks from './plugins/blocks/withBlocks';
import withInlines from './plugins/inlines/withInlines';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+shift+s': 'delete',
  'mod+shift+c': 'code',
  'mod+k': 'link',
};
const BLOCK_HOTKEYS = {
  'mod+1': 'heading-one',
  'mod+2': 'heading-two',
  'mod+3': 'heading-three',
  'mod+4': 'heading-four',
  'mod+5': 'heading-five',
  'mod+6': 'heading-six',
};

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

function matchLink(node) {
  return !SlateEditor.isEditor(node) && SlateElement.isElement(node) && node.type === 'link';
}

function isMarkActive(editor, format) {
  const { selection } = editor;
  if (!selection) return false;

  const marks = SlateEditor.marks(editor);
  return marks ? marks[format] === true : false;
}

// zanimivosti
function isBlockActive(editor, format, options = {}) {
  const { selection } = editor;
  if (!selection) return false;

  // slate way
  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n => !SlateEditor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
    }),
  );

  return !!match;
}

function isBlockReallyActive(editor, format) {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n =>
        !SlateEditor.isEditor(n) &&
        SlateElement.isElement(n) &&
        SlateEditor.isBlock(editor, n) &&
        n.type !== 'paragraph' &&
        n.type !== 'list-item' &&
        !n.type.startsWith('heading-'),
      mode: 'lowest',
    }),
  );

  return !!match && match[0].type === format;
}

function isBlockReallyActiveEvenHeadings(editor, format) {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n =>
        !SlateEditor.isEditor(n) &&
        SlateElement.isElement(n) &&
        SlateEditor.isBlock(editor, n) &&
        n.type !== 'paragraph' &&
        n.type !== 'list-item',
      mode: 'lowest',
    }),
  );

  return !!match && match[0].type === format;
}

function getSelectionMinPathLength(editor) {
  const { selection } = editor;
  if (!selection) return false;

  return Math.min(selection.anchor.path.length, selection.focus.path.length);
}

function getFirstParentNonDefaultBlock(editor, except = []) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    SlateEditor.nodes(editor, {
      at: SlateEditor.unhangRange(editor, selection),
      match: n =>
        !SlateEditor.isEditor(n) &&
        SlateElement.isElement(n) &&
        SlateEditor.isBlock(editor, n) &&
        !['paragraph', 'list-item', ...except].includes(n.type),
      mode: 'lowest',
    }),
  );
  return match;
}

function isWrappingAnotherBlock(editor, format, except) {
  const match = getFirstParentNonDefaultBlock(editor, except);
  return !!match && match[0].type !== format;
}

function isCurrentBlockEmpty(editor) {
  const [node] = SlateEditor.nodes(editor, { mode: 'lowest' }).next().value;
  return !node || !node.text || node.text === '';
}

function isLinkActive(editor) {
  const [link] = SlateEditor.nodes(editor, {
    match: matchLink,
  });
  return !!link;
}

function activeLinkUrl(editor) {
  const [link] = SlateEditor.nodes(editor, {
    match: matchLink,
  });
  if (link) {
    return link[0].url;
  }
}

function wrapLink(editor, url) {
  if (isLinkActive(editor)) {
    Transforms.setNodes(editor, { url }, { match: matchLink });
    return;
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
}

function unwrapLink(editor) {
  Transforms.unwrapNodes(editor, {
    match: matchLink,
  });
}

function withInlines111(editor) {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = element =>
    ['link', 'button', 'break'].includes(element.type) || isInline(element);

  editor.insertText = text => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = data => {
    const text = data.getData('text/plain');

    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
}

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
    onChange,
  } = props;
  const renderElement = useCallback(props => <Element {...props} />, []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // const editorRef = useRef();
  // if (!editorRef.current)
  //   editorRef.current = withReact(withParagraphs(withInlines(createEditor())));
  // const editor = editorRef.current;

  const [editor] = useState(
    withReact((withBlocks(withLists(withInlines(createEditor()))))),
  );

  const emptyValue = [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ];

  const [value, setValue] = useState(props.value ? markdownToSlate(props.value) : emptyValue);

  const editorComponents = getEditorComponents();

  useEffect(() => {
    if (props.pendingFocus) {
      ReactEditor.focus(editor);
    }
  });

  function handleMarkClick(format) {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      SlateEditor.removeMark(editor, format);
    } else {
      SlateEditor.addMark(editor, format, true);
    }
    ReactEditor.focus(editor);
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
    const url = window.prompt(t('editor.editorWidgets.markdown.linkPrompt'), activeLinkUrl(editor));
    if (url == null) return;
    if (url === '') {
      unwrapLink(editor);
      return;
    }
    wrapLink(editor, url);
    ReactEditor.focus(editor);
  }

  function handleToggleMode() {
    props.onMode('raw');
  }

  function handleInsertShortcode(pluginConfig) {
    const text = { text: '' };
    const voidNode = {
      type: 'shortcode',
      children: [text],
      pluginConfig,
    };
    Transforms.insertNodes(editor, voidNode);
    console.log('handleInsertShortcode', pluginConfig);
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

  // const handleDocumentChange = debounce(newValue => {
  //   console.log('handleDocumentChange', newValue);
  //
  // }, 150);

  function handleChange(newValue) {
    // if (slateToMarkdown(newValue) !== slateToMarkdown(value)) {
    setValue(newValue);
    // handleDocumentChange(newValue);
    onChange(slateToMarkdown(newValue));
    // }
    setToolbarKey(prev => prev + 1);
  }

  function hasMark(format) {

    return editor && editor.selection && isMarkActive(editor, format);
  }
  function hasInline() {
    return false;
  }
  function hasBlock(format) {
    return editor && isBlockActive(editor, format);
  }
  function hasQuote() {
    return editor && isBlockActive(editor, 'quote');
  }
  function hasListItems(type) {
    return editor && isBlockActive(editor, type);
  }

  function keyDownHandlerDepr(event) {
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const mark = HOTKEYS[hotkey];

        if (mark == 'link') {
          handleLinkClick();
          return;
        }
        handleMarkClick(mark);
      }
    }
    for (const hotkey in BLOCK_HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        const format = BLOCK_HOTKEYS[hotkey];
        handleBlockClick(format);
      }
    }

    if (isHotkey('backspace', event) && slateToMarkdown(value) == '') {
      console.log('backspace');
      Transforms.setNodes(editor, { type: 'paragraph' });
    }

    if (
      isHotkey('backspace', event) &&
      getFirstParentNonDefaultBlock(editor) &&
      isCurrentBlockEmpty(editor)
    ) {
      Transforms.setNodes(editor, { type: 'paragraph' });
      // event.preventDefault();
      // return false;
    }

    const parentBlock = getFirstParentNonDefaultBlock(editor);
    const parentBlockPreviousNode = parentBlock
      ? SlateEditor.previous(editor, { at: parentBlock[1] })
      : null;

    if (
      isHotkey('backspace', event) &&
      parentBlock &&
      parentBlock[0].type == 'quote' &&
      editor.selection.focus.offset == 0 &&
      !SlateEditor.previous(editor)
    ) {
      // if previous block is a quote, merge them
      Transforms.liftNodes(editor);
      event.preventDefault();
      return;
    }

    if (
      isHotkey('backspace', event) &&
      parentBlock &&
      parentBlock[0].type == 'quote' &&
      editor.selection.focus.offset == 0 &&
      parentBlockPreviousNode &&
      parentBlockPreviousNode[0].type == 'quote'
    ) {
      // if previous block is a quote, merge them
      Transforms.mergeNodes(editor, { at: parentBlock[1] });
      event.preventDefault();
      return;
    }

    // enter if empty non default block is currently active removes the block
    // -- get first parent block element
    // -- unwrap via handleBlockClick
    // -- prevent other actions (this can be before enter+bulleted lis)
    const firstNonDefaultParent = getFirstParentNonDefaultBlock(editor);
    if (
      isHotkey('enter', event) &&
      firstNonDefaultParent &&
      !firstNonDefaultParent[0].type.startsWith('heading') &&
      isCurrentBlockEmpty(editor)
    ) {
      // Transforms.splitNodes(editor, );
      // Transforms.unwrapNodes(editor, {
      //   at: firstNonDefaultParent[1],
      //   split: true
      // })
      Transforms.liftNodes(editor);

      event.preventDefault();
      return;
    }

    if (isHotkey('enter', event)) {
      const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path);
      if (
        editor.selection.anchor.offset == selectedLeaf.text.length ||
        selectedLeaf.text.length == 0
      ) {
        event.preventDefault();
        const newLine = {
          type: 'paragraph',
          children: [
            {
              text: '',
            },
          ],
        };
        Transforms.insertNodes(editor, newLine);
      }
    }

    if (isHotkey('shift+enter', event)) {
      event.preventDefault();
      // todo: this is not really ok
      Transforms.insertNodes(editor, [
        {
          type: 'break',
          children: [
            {
              text: '',
            },
          ],
        },
        {
          type: 'html',
          children: [
            {
              text: '',
            },
          ],
        },
      ]);
      Transforms.select(editor, SlateEditor.end(editor, []));
    }
  }

  function reportSelect(e) {
    // console.log('report select', e)
  }

  function isSelectionValid(editor) {
    const { selection } = editor;
    if (!selection) return true;
    const isValid = !!(
      selection &&
      selection.anchor &&
      SlateEditor.hasPath(editor, selection.anchor.path)
    );

    if (!isValid) {
      console.log('selection is invalid !!!');
    }

    return isValid;
  }

  return (
    <div
      css={coreCss`
        position: relative;
      `}
    >
      <Slate editor={editor} value={value} onChange={handleChange}>
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
              hasMark={() => false}
              hasInline={hasInline}
              hasBlock={() => false}
              hasQuote={() => false}
              hasListItems={() => false}
              // hasMark={hasMark}
              // hasInline={hasInline}
              // hasBlock={hasBlock}
              // hasQuote={hasQuote}
              // hasListItems={hasListItems}
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
                {value.length !== 0 && (
                  <Editable
                    className={css`
                      padding: 16px 20px 0;
                    `}
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    onKeyDown={handleKeyDown}
                    autoFocus={false} // trying to fix race condition bug
                    onSelect={reportSelect}
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
