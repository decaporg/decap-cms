import React from 'react';
import pluralize from 'pluralize';
import { IndexLink } from 'react-router';
import { Menu, MenuItem } from 'react-toolbox';
import AppBar from 'react-toolbox/lib/app_bar';
import FindBar from '../FindBar/FindBar';
import styles from './AppHeader.css';

export default class AppHeader extends React.Component {

  state = {
    createMenuActive: false
  };

  handleCreatePostClick = collectionName => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  handleCreateButtonClick = () => {
    this.setState({
      createMenuActive: true
    });
  };

  handleCreateMenuHide = () => {
    this.setState({
      createMenuActive: false
    });
  };

  render() {
    const {
      collections,
      commands,
      defaultCommands,
      runCommand,
      toggleNavDrawer
    } = this.props;
    const { createMenuActive } = this.state;

    return (
      <AppBar
        fixed
        theme={styles}
        leftIcon="menu"
        rightIcon="create"
        onLeftIconClick={toggleNavDrawer}
        onRightIconClick={this.handleCreateButtonClick}
      >
        <IndexLink to="/">
          Dashboard
        </IndexLink>

        <FindBar
          commands={commands}
          defaultCommands={defaultCommands}
          runCommand={runCommand}
        />
        <Menu
          active={createMenuActive}
          position="topRight"
          onHide={this.handleCreateMenuHide}
        >
          {
            collections.valueSeq().map(collection =>
              <MenuItem
                key={collection.get('name')}
                value={collection.get('name')}
                onClick={this.handleCreatePostClick.bind(this, collection.get('name'))}
                caption={pluralize(collection.get('label'), 1)}
              />
            )
          }
        </Menu>
      </AppBar>
    );
  }
}
