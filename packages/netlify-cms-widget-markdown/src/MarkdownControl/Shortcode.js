/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/core';
import { Map, fromJS } from 'immutable';
import { omit } from 'lodash';
import { getEditorControl, getEditorComponents } from './index';

const Shortcode = ({ editor, node, dataKey = 'shortcodeData', typeOverload }) => {
  const plugin = getEditorComponents().get(typeOverload || node.data.get('shortcode'));
  const EditorControl = getEditorControl();
  const [field, setField] = useState(Map());

  useEffect(() => {
    setField(fromJS(omit(plugin, ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'])));
  }, []);

  const handleChange = (fieldName, value) => {
    if (dataKey === false) {
      editor.setNodeByKey(node.key, { data: value || Map() });
    } else {
      editor.setNodeByKey(node.key, { data: node.data.set('shortcodeData', value) });
    }
  };

  const previousSibling = editor.value.document.getPreviousSibling(node.key);
  const nextSibling = editor.value.document.getNextSibling(node.key);

  const value = dataKey === false ? node.data : fromJS(node.data.get(dataKey));

  return !field.isEmpty() && (
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
      isSelected={editor.isSelected(node)}
    />
  );
};

export default Shortcode;
