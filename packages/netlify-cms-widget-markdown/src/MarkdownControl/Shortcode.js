/* eslint-disable react/prop-types */

import React from 'react';
import { Map } from 'immutable';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { partial, capitalize } from 'lodash';
import { ListItemTopBar, components, colors, lengths } from 'netlify-cms-ui-default';
import { getEditorControl, getEditorComponents } from './index';

const ShortcodeContainer = styled.div`
  ${components.objectWidgetTopBarContainer};
  border-radius: ${lengths.borderRadius};
  border: 2px solid ${colors.textFieldBorder};
  margin: 12px 0;
  padding: 14px;

  ${props =>
    props.collapsed &&
    css`
      background-color: ${colors.textFieldBorder};
      cursor: pointer;
    `};
`;

const ShortcodeTopBar = styled(ListItemTopBar)`
  background-color: ${colors.textFieldBorder};
  margin: -14px -14px 0;
  border-radius: 0;
`;

const ShortcodeTitle = styled.div`
  padding: 8px;
  color: ${colors.controlLabel};
`;

export default class Shortcode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      /**
       * The `shortcodeNew` prop is set to `true` when creating a new Shortcode,
       * so that the form is immediately open for editing. Otherwise all
       * shortcodes are collapsed by default.
       */
      collapsed: !props.node.data.get('shortcodeNew'),
    };
  }

  handleChange = (fieldName, value) => {
    const { editor, node } = this.props;
    const shortcodeData = Map(node.data.get('shortcodeData')).set(fieldName, value);
    const data = node.data.set('shortcodeData', shortcodeData);
    editor.change(c => c.setNodeByKey(node.key, { data }));
  };

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  handleRemove = () => {
    const { editor, node } = this.props;
    editor.change(change => {
      change.removeNodeByKey(node.key).focus();
    });
  };

  handleClick = event => {
    /**
     * Stop click from propagating to editor, otherwise focus will be passed
     * to the editor.
     */
    event.stopPropagation();

    /**
     * If collapsed, any click should open the form.
     */
    if (this.state.collapsed) {
      this.handleCollapseToggle();
    }
  };

  renderControl = (shortcodeData, field) => {
    if (field.get('widget') === 'hidden') return null;
    const value = shortcodeData.get(field.get('name'));
    const key = `field-${field.get('name')}`;
    const Control = getEditorControl();
    const controlProps = { field, value, onChange: this.handleChange };

    return (
      <div key={key}>
        <Control {...controlProps} />
      </div>
    );
  };

  render() {
    const { attributes, node } = this.props;
    const { collapsed } = this.state;
    const pluginId = node.data.get('shortcode');
    const shortcodeData = Map(this.props.node.data.get('shortcodeData'));
    const plugin = getEditorComponents().get(pluginId);
    return (
      <ShortcodeContainer collapsed={collapsed} {...attributes} onClick={this.handleClick}>
        <ShortcodeTopBar
          collapsed={collapsed}
          onCollapseToggle={this.handleCollapseToggle}
          onRemove={this.handleRemove}
        />
        {collapsed ? (
          <ShortcodeTitle>{capitalize(pluginId)}</ShortcodeTitle>
        ) : (
          plugin.get('fields').map(partial(this.renderControl, shortcodeData))
        )}
      </ShortcodeContainer>
    );
  }
}
