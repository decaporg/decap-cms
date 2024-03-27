import React from 'react';
import { createPlugins, Plate, PlateLeaf } from '@udecode/plate-common';
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph';
import {
  createBoldPlugin,
  MARK_BOLD,
  createItalicPlugin,
  MARK_ITALIC,
  createCodePlugin,
  MARK_CODE,
} from '@udecode/plate-basic-marks';
import {
  createHeadingPlugin,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  KEYS_HEADING,
} from '@udecode/plate-heading';
import { createSoftBreakPlugin, createExitBreakPlugin } from '@udecode/plate-break';
import { ClassNames } from '@emotion/react';
import { fonts, lengths, zIndex } from 'decap-cms-ui-default';

import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import { editorStyleVars } from '../styles';
import CodeLeaf from './components/CodeLeaf';
import ParagraphElement from './components/ParagraphElement';
import HeadingElement from './components/HeadingElement';
import withProps from './withProps';

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

const initialValue = [
  {
    id: '1',
    type: 'p',
    children: [{ text: 'Hello, World!' }],
  },
];

export default function VisualEditor(props) {
  const { t, field, className, isDisabled } = props;

  const plugins = createPlugins(
    [
      createParagraphPlugin(),
      createHeadingPlugin(),
      createBoldPlugin(),
      createItalicPlugin(),
      createCodePlugin(),
      createSoftBreakPlugin({
        options: {
          rules: [{ hotkey: 'shift+enter' }],
        },
      }),
      createExitBreakPlugin({
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
                allow: KEYS_HEADING,
              },
              relative: true,
              level: 1,
            },
          ],
        },
      }),
    ],
    {
      components: {
        [MARK_BOLD]: withProps(PlateLeaf, { as: 'b' }),
        [MARK_CODE]: CodeLeaf,
        [MARK_ITALIC]: withProps(PlateLeaf, { as: 'em'}),
        [ELEMENT_PARAGRAPH]: ParagraphElement,
        [ELEMENT_H1]: withProps(HeadingElement, { variant: 'h1' }),
        [ELEMENT_H2]: withProps(HeadingElement, { variant: 'h2' }),
        [ELEMENT_H3]: withProps(HeadingElement, { variant: 'h3' }),
        [ELEMENT_H4]: withProps(HeadingElement, { variant: 'h4' }),
        [ELEMENT_H5]: withProps(HeadingElement, { variant: 'h5' }),
        [ELEMENT_H6]: withProps(HeadingElement, { variant: 'h6' }),
      },
    },
  );

  function handleBlockClick() {
    console.log('handleBlockClick');
  }

  function handleLinkClick() {
    console.log('handleLinkClick');
  }

  function handleToggleMode() {
    console.log('handleToggleMode');
  }

  function handleChange(data) {
    console.log('handleChange', data);
  }

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
          <Plate plugins={plugins} initialValue={initialValue} onChange={handleChange}>
            <Toolbar
              onBlockClick={handleBlockClick}
              onLinkClick={handleLinkClick}
              onToggleMode={handleToggleMode}
              plugins={null}
              buttons={[]}
              editorComponents={[]}
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
