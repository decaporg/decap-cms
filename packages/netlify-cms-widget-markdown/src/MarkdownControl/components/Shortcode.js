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

    const handleChange = (fieldName, value) => {
      if (dataKey === false) {
        editor.setNodeByKey(node.key, { data: value || Map() });
      } else {
        editor.setNodeByKey(node.key, { data: node.data.set('shortcodeData', value) });
      }
    };

    const handleFocus = () => editor.moveToRangeOfNode(node);

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
            isSelected={editor.isSelected(node)}
          />
        </div>
      )
    );
  }
}
