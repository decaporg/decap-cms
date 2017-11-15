import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Menu, MenuItem } from 'react-toolbox/lib/menu';
import { Dropdown, DropdownItem } from '../../../../UI/Dropdown/Dropdown';
import ToolbarButton from './ToolbarButton';

export default class ToolbarComponentsMenu extends React.Component {
  static PropTypes = {
    plugins: ImmutablePropTypes.map.isRequired,
    onComponentMenuItemClick: PropTypes.func.isRequired,
  };

  render() {
    const { plugins, onComponentMenuItemClick, disabled } = this.props;
    return (
      <div className="nc-toolbarComponentsMenu-root">
        <Dropdown
          button={
            <ToolbarButton
              label="Add Component"
              icon="add-with"
              action={this.handleComponentsMenuToggle}
              disabled={disabled}
            />
          }
        >
          {plugins.toList().map(plugin => (
            <DropdownItem
              label={plugin.get('label')}
              onClick={() => onComponentMenuItemClick(plugin)}
            />
          ))}
        </Dropdown>
      </div>
    );
  }
}
