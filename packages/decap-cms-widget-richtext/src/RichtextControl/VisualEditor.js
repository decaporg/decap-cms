import React from 'react';
import { createPlugins, Plate } from '@udecode/plate-common';
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph';
import { createBoldPlugin, MARK_BOLD, createItalicPlugin, MARK_ITALIC, createCodePlugin, MARK_CODE } from '@udecode/plate-basic-marks';
import { ClassNames } from '@emotion/react';
import { fonts, lengths, zIndex } from 'decap-cms-ui-default';

import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import { editorStyleVars } from '../styles';
import CodeLeaf from './components/CodeLeaf';
import ParagraphElement from './components/ParagraphElement';
import BoldLeaf from './components/BoldLeaf';
import ItalicLeaf from './components/ItalicLeaf';

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

  const plugins = createPlugins([
    createParagraphPlugin(),
    createBoldPlugin(),
    createItalicPlugin(),
    createCodePlugin(),
  ],
  {
      components: {
        [MARK_BOLD]: BoldLeaf,
        [MARK_CODE]: CodeLeaf,
        [MARK_ITALIC]: ItalicLeaf,
        [ELEMENT_PARAGRAPH]: ParagraphElement,
      },
  });

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
