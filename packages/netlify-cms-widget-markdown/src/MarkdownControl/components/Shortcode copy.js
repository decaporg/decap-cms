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
    console.log('props', this.props)
    // const { node, typeOverload } = this.props;
    const { element } = this.props;
    const plugin = getEditorComponents().get(element.pluginConfig.id);
    const fieldKeys = ['id', 'fromBlock', 'toBlock', 'toPreview', 'pattern', 'icon'];
    const field = fromJS(omit(plugin, fieldKeys));
    this.setState({ field });
  }

  render() {
    // const { editor, element, dataKey = 'shortcodeData' } = this.props;
    const { field } = this.state;
    const EditorControl = getEditorControl();
    // const value = dataKey === false ? node.data : fromJS(node.data.get(dataKey));
    const value = ''

    function handleChange(fieldName, value, metadata) {
      // console.log(''value);
      // const dataValue = dataKey === false ? value : node.data.set('shortcodeData', value);
      // editor.setNodeByKey(node.key, { data: dataValue || Map(), metadata });
    }

    function handleFocus() {
      // return editor.moveToRangeOfNode(node);
    }

    console.log(field)

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
            onValidateObject={()=>{}}
            // isNewEditorComponent={node.data.get('shortcodeNew')}
            // isSelected={editor.isSelected(node)}
          />
        </div>
      )
    );
  }
}
