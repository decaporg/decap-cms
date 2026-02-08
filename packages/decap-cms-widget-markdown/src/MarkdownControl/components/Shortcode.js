/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/react';
import { fromJS } from 'immutable';
import omit from 'lodash/omit';
import noop from 'lodash/noop';
import { ReactEditor, useSlate } from 'slate-react';
import { Range, Transforms } from 'slate';

import { getEditorControl, getEditorComponents } from '../index';

function Shortcode(props) {
  const editor = useSlate();
  const { element, dataKey = 'shortcodeData', children } = props;
  const EditorControl = getEditorControl();
  const plugin = getEditorComponents().get(element.data.shortcode);
  const fieldKeys = ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'];

  const field = useMemo(() => fromJS(omit(plugin, fieldKeys)), [plugin]);
  const [value, setValue] = useState(fromJS(element.data[dataKey]));

  const handleChange = useCallback((fieldName, value, metadata) => {
    const path = ReactEditor.findPath(editor, element);
    const newProperties = {
      data: {
        ...element.data,
        [dataKey]: value.toJS(),
        metadata,
      },
    };
    Transforms.setNodes(editor, newProperties, {
      at: path,
    });
    setValue(value);
  }, [editor, element, dataKey]);

  useEffect(() => {
    console.log('editor or element or dataKey changed, updating value');
  }, [editor, element, dataKey]);

  function handleFocus() {
    const path = ReactEditor.findPath(editor, element);
    Transforms.select(editor, path);
  }

  const path = ReactEditor.findPath(editor, element);
  const isSelected =
    editor.selection &&
    path &&
    Range.isRange(editor.selection) &&
    Range.includes(editor.selection, path);

  return (
    !field.isEmpty() && (
      <div onClick={handleFocus} onFocus={handleFocus}>
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
          onValidateObject={noop}
          isNewEditorComponent={element.data.shortcodeNew}
          isSelected={isSelected}
        />
        {children}
      </div>
    )
  );
}

export default Shortcode;
