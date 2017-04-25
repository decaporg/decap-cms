import React, { PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Menu, MenuItem } from 'react-toolbox/lib/menu';
import ToolbarButton from './ToolbarButton';
import styles from './ToolbarComponentsMenu.css';

export default class ToolbarComponentsMenu extends React.Component {
  static PropTypes = {
    plugins: ImmutablePropTypes.list.isRequired,
    onComponentMenuItemClick: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      componentsMenuActive: false,
    };
  }

  handleComponentsMenuToggle = () => {
    this.setState({ componentsMenuActive: !this.state.componentsMenuActive });
  };

  handleComponentsMenuHide = () => {
    this.setState({ componentsMenuActive: false });
  };

  render() {
    const { plugins, onComponentMenuItemClick } = this.props;
    return (
      <div className={styles.root}>
        <ToolbarButton label="Add Component" icon="plus" action={this.handleComponentsMenuToggle}/>
        <Menu
          active={this.state.componentsMenuActive}
          position="auto"
          onHide={this.handleComponentsMenuHide}
          ripple={false}
        >
          {plugins.map(plugin => (
            <MenuItem
              key={plugin.get('id')}
              value={plugin.get('id')}
              caption={plugin.get('label')}
              onClick={() => onComponentMenuItemClick(plugin)}
              className={styles.menuItem}
            />
          ))}
        </Menu>
      </div>
    );
  }
}
