import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css, ClassNames } from '@emotion/react';
import { lengths, fonts } from 'decap-cms-ui-default';
import { ParagraphPlugin, Plate, usePlateEditor } from 'platejs/react';
import { SingleBlockPlugin } from 'platejs';

import { editorContainerStyles, EditorControlBar } from '../styles';
import defaultEmptyBlock from './defaultEmptyBlock';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import ParagraphElement from './components/Element/ParagraphElement';

function editorStyles({ minimal }) {
  return css`
    position: relative;
    overflow: hidden;
    overflow-x: auto;
    min-height: ${minimal ? 'auto' : lengths.richTextEditorMinHeight};
    font-family: ${fonts.mono};
    display: flex;
    flex-direction: column;
  `;
}

function RawEditor(props) {
  const { className, field, isShowModeToggle, t, onChange, value } = props;

  const initialValue = [defaultEmptyBlock(value || '')];

  const editor = usePlateEditor({
    plugins: [SingleBlockPlugin],
    override: {
      components: {
        [ParagraphPlugin.key]: ParagraphElement,
      },
    },
    value: initialValue,
  });

  useEffect(() => {
    if (props.pendingFocus) {
      editor.tf.focus({ edge: 'endEditor' });
      props.pendingFocus();
    }
  }, [props.pendingFocus]);

  function handleToggleMode() {
    props.onMode('rich_text');
  }

  function handleChange({ value }) {
    onChange(value.map(line => line.children[0].text).join('\n'));
  }

  return (
    <Plate editor={editor} value={initialValue} initialValue={initialValue} onChange={handleChange}>
      <ClassNames>
        {({ cx, css }) => (
          <div
            className={cx(
              className,
              css`
                ${editorContainerStyles}
              `,
            )}
          >
            <EditorControlBar>
              <Toolbar
                onToggleMode={handleToggleMode}
                buttons={field.get('buttons')}
                disabled
                rawMode
                isShowModeToggle={isShowModeToggle}
                t={t}
              />
            </EditorControlBar>
            <div css={editorStyles({ minimal: field.get('minimal') })}>
              <Editor />
            </div>
          </div>
        )}
      </ClassNames>
    </Plate>
  );
}

RawEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onMode: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  value: PropTypes.string,
  field: ImmutablePropTypes.map.isRequired,
  isShowModeToggle: PropTypes.bool.isRequired,
  t: PropTypes.func.isRequired,
};

export default RawEditor;
