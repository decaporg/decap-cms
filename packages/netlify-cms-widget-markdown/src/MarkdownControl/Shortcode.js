/* eslint-disable react/prop-types */

import React, { useState, useEffect } from 'react';
import { Map, fromJS } from 'immutable';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { omit } from 'lodash';
import { ListItemTopBar, components, colors, lengths } from 'netlify-cms-ui-default';
import ObjectWidget from 'netlify-cms-widget-object';
import CMS from 'netlify-cms-core';
import { getEditorControl, getEditorComponents } from './index';

const ObjectControl = ObjectWidget.controlComponent;

const Shortcode = ({ editor, attributes, node, classNameWrapper }) => {
  const plugin = getEditorComponents().get(node.data.get('shortcode'));
  const Control = CMS.resolveWidget(plugin.widget).control;

  /**
   * The `shortcodeNew` prop is set to `true` when creating a new Shortcode,
   * so that the form is immediately open for editing. Otherwise all
   * shortcodes are collapsed by default.
   */
  const [collapsed, setCollapsed] = useState(!node.data.get('shortcodeNew'));
  const [field, setField] = useState(Map());

  useEffect(() => {
    setField(fromJS(omit(plugin, ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'])));
  }, []);

  const shortcodeData = Map(node.data.get('shortcodeData'));

  const handleChange = (fieldName, value) => {
    const data = node.data.set('shortcodeData', shortcodeData.set(fieldName, value));
    editor.setNodeByKey(node.key, { data });
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleRemove = () => {
    editor.removeNodeByKey(node.key).focus();
  };

  const handleClick = event => {
    /**
     * Stop click from propagating to editor, otherwise focus will be passed
     * to the editor.
     */
    event.stopPropagation();
  };

  return (
    <div {...attributes} draggable={true} onClick={handleClick}>
      <Control
        classNameWrapper={classNameWrapper}
        value={shortcodeData}
        field={field}
        onChangeObject={handleChange}
        editorControl={getEditorControl()}
        resolveWidget={CMS.resolveWidget}
      />
    </div>
  );
}

export default Shortcode;
