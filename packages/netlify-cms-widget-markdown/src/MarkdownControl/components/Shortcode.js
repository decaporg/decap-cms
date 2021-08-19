/* eslint-disable react/prop-types */
import React from 'react';
import { css } from '@emotion/core';
import { Map, fromJS } from 'immutable';
import { omit } from 'lodash';

import { getEditorControl, getEditorComponents } from '../index';

export default class Shortcode extends React.Component {
  state = {
    field: Map(),
  };

  componentDidMount() {
    const { node, typeOverload } = this.props;
    const plugin = getEditorComponents().get(typeOverload || node.data.get('shortcode'));
    const fieldKeys = ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'];
    const field = fromJS(omit(plugin, fieldKeys));
    this.setState({ field });
  }

  render() {
    const { editor, node, dataKey = 'shortcodeData' } = this.props;
    const { field } = this.state;
    const EditorControl = getEditorControl();
    const value = dataKey === false ? node.data : fromJS(node.data.get(dataKey));

    function handleChange(fieldName, value, metadata) {
      const dataValue = dataKey === false ? value : node.data.set('shortcodeData', value);
      editor.setNodeByKey(node.key, { data: dataValue || Map(), metadata });
    }

    function handleFocus() {
      return editor.moveToRangeOfNode(node);
    }

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
            isNewEditorComponent={node.data.get('shortcodeNew')}
            isSelected={editor.isSelected(node)}
          />
        </div>
      )
    );
  }
}
