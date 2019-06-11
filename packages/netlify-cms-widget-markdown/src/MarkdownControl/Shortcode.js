/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Map, fromJS } from 'immutable';
import { omit } from 'lodash';
import { IconButton } from 'netlify-cms-ui-default';
import { getEditorControl, getEditorComponents } from './index';

const ActionButtonContainer = styled.div`
  position: absolute;
  top: 36px;
  left: -18px;
  z-index: 1;
`;

const ActionButton = styled(IconButton)`
  position: sticky;
`;

const StyledShortcode = styled.div`
  position: relative;
`;

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
      <StyledShortcode {...attributes} onClick={handleClick}>
        <ActionButtonContainer>
          <ActionButton size="small" type="close"/>
        </ActionButtonContainer>
        <EditorControl
          value={fromJS(node.data.get('shortcodeData'))}
          field={field}
          onChange={handleChange}
        />
      </StyledShortcode>
    )
  );
};

export default Shortcode;
