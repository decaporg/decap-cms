import React, { useState } from 'react';
import styled from '@emotion/styled';
import { fromJS } from 'immutable';
import { omit } from 'lodash';
import { css } from '@emotion/react';
import { Range, setNodes } from 'slate';
import { zIndex } from 'decap-cms-ui-default';
import { ParagraphPlugin, PlateElement, useEditorRef } from 'platejs/react';

import { useEditorContext } from '../../editorContext';

const StyledDiv = styled.div``;

function InsertionPoint(props) {
  return (
    <div
      css={css`
        height: 32px;
        cursor: text;
        position: relative;
        z-index: ${zIndex.zIndex1};
        margin-top: -16px;
      `}
      {...props}
    />
  );
}

function ShortcodeElement(props) {
  const editor = useEditorRef();
  const { element, dataKey = 'shortcodeData', children } = props;
  const { editorControl: EditorControl, editorComponents } = useEditorContext();
  const plugin = editorComponents.get(element.id);
  const fieldKeys = ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'];

  const field = fromJS(omit(plugin, fieldKeys));
  const [value, setValue] = useState(fromJS(element?.data[dataKey] ?? { id: '' }));

  const path = editor.api.findPath(element);
  const isSelected =
    editor.selection &&
    path &&
    Range.isRange(editor.selection) &&
    Range.includes(editor.selection, path);
  const insertBefore = path[0] === 0;

  function handleChange(fieldName, value, metadata) {
    const newProperties = {
      data: {
        ...element.data,
        [dataKey]: value.toJS(),
        metadata,
      },
    };
    setNodes(editor, newProperties, {
      at: path,
    });
    setValue(value);
  }

  function handleInsertBefore() {
    editor.tf.insertNodes(
      { type: ParagraphPlugin.key, children: [{ text: '' }] },
      { at: path, select: true },
    );
  }

  return (
    <>
      <PlateElement asChild {...props} contentEditable={false}>
        <StyledDiv>
          {insertBefore && <InsertionPoint onClick={handleInsertBefore} />}
          <EditorControl
            css={css`
              margin-top: 0;
              margin-bottom: 16px;

              &:first-of-type {
                margin-top: 0;
              }
            `}
            value={value}
            field={field}
            onChange={handleChange}
            isEditorComponent={true}
            onValidateObject={() => {}}
            isNewEditorComponent={element.data?.shortcodeNew}
            isSelected={isSelected}
          />
          {children}
        </StyledDiv>
      </PlateElement>
    </>
  );
}

export default ShortcodeElement;
