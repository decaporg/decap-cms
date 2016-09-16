import React from 'react';
import pluralize from 'pluralize';
import { IndexLink } from 'react-router';
import { Menu, MenuItem, Button } from 'react-toolbox';
import AppBar from 'react-toolbox/lib/app_bar';
import FindBar from '../FindBar/FindBar';
import styles from './AppHeader.css';

export default class AppHeader extends React.Component {

  // props: {
  //   // collections: React.,
  //   // commands,
  //   // defaultCommands
  // }

  state = {
    createMenuActive: false
  }

  handleCreatePostClick = collectionName => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  }

  onCreateButtonClick = () => {
    this.setState({
      createMenuActive: true
    });
  }

  onCreateMenuHide = () => {
    this.setState({
      createMenuActive: false
    });
  }

  render() {
    const { collections, commands, defaultCommands, runCommand } = this.props;
    const { createMenuActive } = this.state;

    return (
      <AppBar
          fixed
          theme={styles}
      >
        <IndexLink to="/">
          Dashboard
        </IndexLink>
        <FindBar
            commands={commands}
            defaultCommands={defaultCommands}
            runCommand={runCommand}
        />
        <Button
            className={styles.createBtn}
            icon='add'
            floating
            accent
            onClick={this.onCreateButtonClick}
        >
          <Menu
              active={createMenuActive}
              position="topRight"
              onHide={this.onCreateMenuHide}
          >
            {
              collections.map(collection =>
                <MenuItem
                    key={collection.get('name')}
                    value={collection.get('name')}
                    onClick={this.handleCreatePostClick.bind(this, collection.get('name'))}
                    caption={pluralize(collection.get('label'), 1)}
                />
              )
            }
          </Menu>
        </Button>
      </AppBar>
    );
  }
}
