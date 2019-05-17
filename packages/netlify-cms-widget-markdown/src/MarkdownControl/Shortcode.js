/* eslint-disable react/prop-types */

import React, { useState, useEffect } from 'react';
import { Map, fromJS } from 'immutable';
import { omit } from 'lodash';
import { getEditorControl, getEditorComponents } from './index';

const Shortcode = ({ editor, attributes, node }) => {
  const plugin = getEditorComponents().get(node.data.get('shortcode'));
  const EditorControl = getEditorControl();
  const [field, setField] = useState(Map());

  useEffect(() => {
    setField(fromJS(omit(plugin, ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'])));
  }, []);

  const handleChange = (fieldName, value) => {
    const data = node.data.set('shortcodeData', value);
    editor.setNodeByKey(node.key, { data });
  };

  const handleClick = event => {
    event.stopPropagation();
  };

  return (
    !field.isEmpty() && (
      <div {...attributes} onClick={handleClick}>
        <EditorControl
          value={fromJS(node.data.get('shortcodeData'))}
          field={field}
          onChange={handleChange}
        />
      </div>
    )
  );
};

export default Shortcode;
