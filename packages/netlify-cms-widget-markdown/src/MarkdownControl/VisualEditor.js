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

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
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

function withInlines(editor) {
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

function withParagraphs(editor) {
  const { normalizeNode } = editor;

  // while this works, let's keep it commented until list -> quote wrap works on it's own
  editor.normalizeNode = entry => {
    const [node, path] = entry;
    let previousType = null;
    if (SlateElement.isElement(node) || SlateEditor.isEditor(node)) {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (child.type === 'bulleted-list' && child.type === previousType) {
          Transforms.mergeNodes(editor, { at: childPath });
          break;
        }
        previousType = child.type;
      }
    }

    // Fall back to the original `normalizeNode` to enforce other constraints.
    normalizeNode(entry);
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

  const [editor] = useState(withReact(withParagraphs(withInlines(withLists(createEditor())))));

  // console.count('render')

  const emptyValue = [
    // {
    //   type: 'paragraph',
    //   children: [{ text: '' }],
    // },
    {
        type: 'bulleted-list',
        children: [{
          type: 'list-item',
          children: [{
            type: 'paragraph',
            children: [{ text: 'foo'}],
          }],
        },{
          type: 'list-item',
          children: [{
            type: 'paragraph',
            children: [{ text: 'bar'}],
          }],
        },{
          type: 'list-item',
          children: [{
            type: 'paragraph',
            children: [{ text: 'baz'}],
          }],
        }],
      }
    // {
    //   type: 'quote',
    //   children: [{
    //     type: 'bulleted-list',
    //     children: [{
    //       type: 'list-item',
    //       children: [{
    //         type: 'quote',
    //         children: [{
    //           type: 'bulleted-list',
    //             children: [{
    //               type: 'list-item',
    //               children: [{
    //                 type: 'quote',
    //                 children: [{
    //                   type: 'bulleted-list',
    //                     children: [{
    //                       type: 'list-item',
    //                       children: [{
    //                         type: 'quote',
    //                         children: [{
    //                           type: 'paragraph',
    //                           children: [{ text: ''}],
    //                         }],
    //                       }],
    //                     }],
    //                   }],
    //               }],
    //           }],
    //         }],
    //       }],
    //     }],
    //   }],
    // },
    // {
    //   type: 'bulleted-list',
    //   children: [
    //     {
    //       type: 'list-item',
    //       children: [
    //         {
    //           type: 'paragraph',
    //           children: [{ text: 'foo' }],
    //         },
    //       ],
    //     },
    //     {
    //       type: 'list-item',
    //       children: [
    //         {
    //           type: 'paragraph',
    //           children: [{ text: 'bar' }],
    //         },
    //         {
    //           type: 'numbered-list',
    //           children: [
    //             {
    //               type: 'list-item',
    //               children: [
    //                 {
    //                   type: 'paragraph',
    //                   children: [{ text: 'baz' }],
    //                 },
    //                 {
    //                   type: 'bulleted-list',
    //                   children: [
    //                     {
    //                       type: 'list-item',
    //                       children: [
    //                         {
    //                           type: 'paragraph',
    //                           children: [{ text: 'qux' }],
    //                         },
    //                       ],
    //                     },
    //                   ]
    //                 }
    //               ],
    //             },
    //           ]
    //         }
    //       ],
    //     },
    //   ],
    // },
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
    const isActive = isBlockActive(editor, format);
    const isList = LIST_TYPES.includes(format);
    const isHeading = format.startsWith('heading');
    const { selection } = editor;
    if (!selection) return false;

    // Transforms.unwrapNodes(editor, {
    //   match: n =>
    //     !SlateEditor.isEditor(n) &&
    //     SlateElement.isElement(n) &&
    //     LIST_TYPES.includes(n.type) &&
    //     !TEXT_ALIGN_TYPES.includes(format),
    //   split: true,
    // });

    // let newProperties;
    // if (TEXT_ALIGN_TYPES.includes(format)) {
    //   newProperties = {
    //     align: isActive ? undefined : format,
    //   };
    // } else {
    //   newProperties = {
    //     type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    //   };
    // }
    // Transforms.setNodes(editor, newProperties);

    // Headings do not contain paragraphs while other block items do
    if (isHeading) {
      Transforms.setNodes(editor, { type: isActive ? 'paragraph' : format });
      ReactEditor.focus(editor);
      return;
    }

    // if not active or active, but wrapping another block and selection is collapsed (lol)
    // const isActiveAndWrapping = isEqual(editor.selection.anchor.path, editor.selection.focus.path);
    const isCollapsed = Range.isCollapsed(editor.selection);

    // catch exception - change list type from one to another
    //

    if (
      (isBlockReallyActive(editor, 'bulleted-list') && format === 'numbered-list') ||
      (isBlockReallyActive(editor, 'numbered-list') && format === 'bulleted-list')
    ) {
      // this is beautiful, use wherever you are manipulating path now
      Transforms.wrapNodes(
        editor,
        { type: format },
        {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        },
      );
      Transforms.liftNodes(editor, {
        match: (_, path) => path.length === getSelectionMinPathLength(editor) - 3,
        split: true,
      });
      ReactEditor.focus(editor);
      return;
    }

    if (!isActive || (isWrappingAnotherBlock(editor, format) && isCollapsed)) {
      const isListItem =
        isBlockActive(editor, 'bulleted-list') || isBlockActive(editor, 'numbered-list');
      // Transforms.wrapNodes(editor, { type: format });
      // if (isListItem && !Range.isCollapsed(editor.selection)) {
      //   console.log('hmmm?')
      //   // Transforms.splitNodes(editor, {
      //   //   match: n => SlateElement.isElement(n) && n.type === 'bulleted-list',
      //   // })
      //   // Transforms.liftNodes(editor);

      //   // Only do this shit if selection is multiple lines
      //   // Transforms.wrapNodes(editor, { type: format }); // not even sure what we are doing
      //   // Transforms.liftNodes(editor, {
      //   //   match: n => !SlateEditor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      //   // });

      //   // use the beautiful script from ol / ul switch

      //   console.log('attention, we are in a list item');
      // }
      // If in list and multiple nodes are selected, split the list type block
      if (
        isListItem &&
        selection.focus.path[selection.focus.path.length - 3] !=
          selection.anchor.path[selection.anchor.path.length - 3]
      ) {
        const listType = isBlockActive(editor, 'bulleted-list') ? 'bulleted-list' : 'numbered-list';
        Transforms.wrapNodes(
          editor,
          { type: listType },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
          },
        );
        Transforms.wrapNodes(
          editor,
          { type: format },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 3,
          },
        );
        Transforms.liftNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 4,
          split: true,
        });
        // Transforms.liftNodes(editor, {
        //   match: (_, path) => path.length === getSelectionMinPathLength(editor) - 3,
        //   split: true,
        // });

        // Transforms.wrapNodes(
        //   editor,
        //   { type: format },
        //   {
        //     match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        //   },
        // );
      } else {
        Transforms.wrapNodes(editor, { type: format });
      }

      // For lists, wrap all the paragraph elements into list items
      if (isList) {
        const listItems = SlateEditor.nodes(editor, {
          match: node => 'paragraph' === node.type,
        });
        for (const listItem of listItems) {
          Transforms.wrapNodes(editor, { type: 'list-item' }, { at: listItem[1] });
        }
      }
    } else {
      // Unwrap the current block element from format
      Transforms.unwrapNodes(editor, {
        match: n =>
          !SlateEditor.isEditor(n) &&
          SlateElement.isElement(n) &&
          (n.type === format ||
            (isList && (n.type === 'bulleted-list' || n.type === 'numbered-list'))),
        split: isList,
      });
      if (isList) {
        Transforms.unwrapNodes(editor, {
          match: n =>
            !SlateEditor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item',
        });
      }
    }
    ReactEditor.focus(editor);
    return;
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
    // if (editor && editor.selection) {
    //   console.log('hasmarkselection 1', JSON.parse(JSON.stringify(editor.selection.focus.path)));
    //   console.log('hasmarkselection', JSON.parse(JSON.stringify(SlateEditor.node(editor, { at: editor.selection.focus.path }))));
    // }

    console.log('has mark document', JSON.stringify(editor.children));

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

    // and if selection is point?
    if (
      isHotkey('backspace', event) &&
      editor.selection.focus.offset == 0 &&
      (isBlockReallyActiveEvenHeadings(editor, 'bulleted-list') ||
        isBlockReallyActiveEvenHeadings(editor, 'numbered-list'))
    ) {
      if (editor.selection.focus.path[editor.selection.focus.path.length - 3] == 0) {
        Transforms.unwrapNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        });
        Transforms.unwrapNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        });
      } else {
        Transforms.mergeNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
        });
      }
      event.preventDefault();
      return false;
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

    if (
      isHotkey('enter', event) &&
      (isBlockReallyActive(editor, 'bulleted-list') || isBlockReallyActive(editor, 'numbered-list'))
    ) {
      /**
       * When hitting enter in lists
       *  - if the cursor is at the beginning, unwrap the list item
       *  - if list has a nested list, insert a new item to the beging of the nested list
       *  - if an empty paragraph in a list item has previous elements, convert it to a list item
       *  - otherwise create a new item in the current list
       */

      const path = editor.selection.focus.path;

      const nodeParent = Node.parent(editor, [...path.slice(0, -1)]);

      // if you change this, always test: creates new quote block if parent is not a quote, can deeply nest
      console.log('node parent', nodeParent.children);
      if (
        nodeParent.children.length > 1 &&
        nodeParent.children[nodeParent.children.length - 1].type != 'bulleted-list' &&
        nodeParent.children[nodeParent.children.length - 1].type != 'numbered-list'
      ) {
        //haha
        console.log('ttt', nodeParent.type);
        Transforms.liftNodes(editor);
        Transforms.wrapNodes(editor, { type: 'list-item' });
        // wrap into list item
        // lift
        event.preventDefault();
        return;
      }

      if (editor.selection.focus.offset == 0) {
        Transforms.liftNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
          split: true,
        });
        if (
          isBlockReallyActive(editor, 'bulleted-list') ||
          isBlockReallyActive(editor, 'numbered-list')
        ) {
          Transforms.liftNodes(editor, {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
            split: true,
          });
        } else {
          Transforms.unwrapNodes(editor, {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
            split: true,
          });
        }
        event.preventDefault();
        // handleBlockClick(isBlockActive('bulleted-list') ? 'bulleted-list' : 'numbered-list'); // can this be nicer? most probably.. (unwrap?)
        return false;
      }
      const newLine = {
        type: 'list-item',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                text: '',
              },
            ],
          },
        ],
      };

      // change path if list has children

      // const selectedNode = editor.selection && SlateEditor.node(editor, editor.selection.focus)
      let insertPath = [...path.slice(0, -3), path[path.length - 3] + 1];

      if (
        nodeParent.children.length > 1 &&
        (nodeParent.children[1].type == 'bulleted-list' ||
          nodeParent.children[1].type == 'numbered-list')
      ) {
        console.log('found exception, fix insert path'); // figure and describe what this is
        insertPath = [...path.slice(0, -2), 1, 0];
      }

      // zanimivosti
      Transforms.insertNodes(editor, newLine, {
        at: insertPath,
        // select: true,
        // select: true, //set timeout below should be the same as this, but this sometimes leaves the cursor in the same line when cypress is testing
      });
      setTimeout(() => {
        Transforms.select(editor, {
          anchor: { path: [...insertPath, 0, 0], offset: 0 },
          focus: { path: [...insertPath, 0, 0], offset: 0 },
        });
      });
      event.preventDefault();
      return false;
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

    if (isHotkey('tab', event)) {
      console.log('TAB KEY PRESSED');
      event.preventDefault();
      const path = editor.selection.anchor.path;

      if (path[path.length - 3] == 0 || (!isBlockReallyActive(editor, 'bulleted-list') && !isBlockReallyActive(editor, 'numbered-list'))) {
        return false;
      }

      const listType = isBlockActive(editor, 'numbered-list') ? 'numbered-list' : 'bulleted-list';
      setTimeout(() => {
        Transforms.mergeNodes(editor, {
          at: path.slice(0, -2),
        });
        Transforms.wrapNodes(
          editor,
          { type: 'list-item' },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) -1,
          },
        );
        Transforms.wrapNodes(
          editor,
          { type: listType },
          {
            match: (_, path) => path.length === getSelectionMinPathLength(editor) -2,
          },
        );
      });
      // setTimeout(() => {
      // });
      // setTimeout(() => {
      //   Transforms.wrapNodes(
      //     editor,
      //     { type: 'list-item' },
      //     {
      //       match: (_, path) => path.length === getSelectionMinPathLength(editor) -1,
      //     },
      //   );
      // });
      // setTimeout(() => {
      //   Transforms.wrapNodes(
      //     editor,
      //     { type: listType },
      //     {
      //       match: (_, path) => path.length === getSelectionMinPathLength(editor) -2,
      //     },
      //   );
      // });
      return false;
      // return false;
      // zanimivosti?
      // this is just horrible - not even checking if in a list and not handling different types of lists
      const offset = editor.selection.focus.offset;
      const targetPath = [...path.slice(0, -3), path[path.length - 3] - 1, 1];
      Transforms.wrapNodes(
        editor,
        { type: isBlockActive(editor, 'numbered-list') ? 'numbered-list' : 'bulleted-list' },
        { at: path.slice(0, -2) },
      );
      Transforms.moveNodes(editor, { at: path.slice(0, -2), to: targetPath });
      // Transforms.select(editor, {
      //   anchor: { path: [...targetPath, 0, 0, 0], offset },
      //   focus: { path: [...targetPath, 0, 0, 0], offset },
      // });

      return false;
    }

    if (
      isHotkey('shift+tab', event) &&
      (isBlockReallyActive(editor, 'bulleted-list') || isBlockReallyActive(editor, 'numbered-list'))
    ) {
      console.log('SHIFT TAB KEY PRESSED');

      if (getSelectionMinPathLength(editor) > 4) {
        Transforms.liftNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
          split: true,
        });
        Transforms.liftNodes(editor, {
          match: (_, path) => path.length === getSelectionMinPathLength(editor) - 2,
          split: true,
        });
      }

      event.preventDefault();
      return false;
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

  function keyDownHandler(event) {
    for (const handler of editor.keyDownHandlers || []) {
      if (handler(event, editor) === false) {
        break;
      }
    }
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
                    onKeyDown={keyDownHandler}
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
