/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Map, fromJS } from 'immutable';
import { omit } from 'lodash';
import { colors, lengths } from 'netlify-cms-ui-default';
import { getEditorControl, getEditorComponents } from './index';

const InsertionPoint = styled.div`
  height: 32px;
  margin-top: ${props => (props.atStart && '-8px') || (props.atEnd && '8px') || '8px'};
  margin-bottom: ${props => (props.atStart && '-8px') || (props.atEnd && '-8px') || '-24px'};
  cursor: text;
`;

const Shortcode = ({ editor, attributes, node, dataKey = 'shortcodeData', typeOverload }) => {
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

  const handleClick = event => {
    event.stopPropagation();
  };

  const previousSibling = editor.value.document.getPreviousSibling(node.key);
  const nextSibling = editor.value.document.getNextSibling(node.key);

  const value = dataKey === false ? node.data : fromJS(node.data.get(dataKey));

  return (
    !field.isEmpty() && (
      <div {...attributes} onClick={handleClick}>
        {!previousSibling && (
          <InsertionPoint atStart onClick={() => {
            editor
              .insertNodeByKey(editor.value.document.key, 0, { type: 'paragraph', object: 'block' })
              .moveToStartOfDocument();
          }}/>
        )}
        <EditorControl
          value={value}
          field={field}
          onChange={handleChange}
          isEditorComponent={true}
          isSelected={editor.isSelected(node)}
        />
        {(!nextSibling || nextSibling.data.get('isShortcode')) && (
          <InsertionPoint atEnd={!nextSibling} onClick={() => {
            editor
              .moveToEndOfNode(node)
              .insertBlock('paragraph')
              .focus();
          }}/>
        )}
      </div>
    )
  );
};

export default Shortcode;
