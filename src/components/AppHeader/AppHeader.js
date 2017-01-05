import React, { PropTypes } from "react";
import ImmutablePropTypes from "react-immutable-proptypes";
import pluralize from "pluralize";
import { IndexLink } from "react-router";
import { IconMenu, Menu, MenuItem } from "react-toolbox/lib/menu";
import Avatar from "react-toolbox/lib/avatar";
import AppBar from "react-toolbox/lib/app_bar";
import FontIcon from "react-toolbox/lib/font_icon";
import FindBar from "../FindBar/FindBar";
import { stringToRGB } from "../../lib/textHelper";
import styles from "./AppHeader.css";

export default class AppHeader extends React.Component {

  static propTypes = {
    user: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    commands: PropTypes.array.isRequired, // eslint-disable-line
    defaultCommands: PropTypes.array.isRequired, // eslint-disable-line
    runCommand: PropTypes.func.isRequired,
    toggleDrawer: PropTypes.func.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
  };

  state = {
    createMenuActive: false,
    userMenuActive: false,
  };

  handleCreatePostClick = (collectionName) => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  handleCreateButtonClick = () => {
    this.setState({
      createMenuActive: true,
    });
  };

  handleCreateMenuHide = () => {
    this.setState({
      createMenuActive: false,
    });
  };

  handleRightIconClick = () => {
    this.setState({
      userMenuActive: !this.state.userMenuActive,
    });
  };

  render() {
    const {
      user,
      collections,
      commands,
      defaultCommands,
      runCommand,
      toggleDrawer,
      onLogoutClick,
    } = this.props;

    const {
      createMenuActive,
      userMenuActive,
    } = this.state;

    const avatarStyle = {
      backgroundColor: `#${ stringToRGB(user.get("name")) }`,
    };

    return (
      <AppBar
        fixed
        theme={styles}
        leftIcon="menu"
        rightIcon={
          <div>
            <Avatar
              style={avatarStyle}
              title={user.get("name")}
              image={user.get("avatar_url")}
            />
            <Menu
              active={userMenuActive}
              position="topRight"
              onHide={this.handleRightIconClick}
            >
              <MenuItem onClick={onLogoutClick}>Log out</MenuItem>
            </Menu>
          </div>
        }
        onLeftIconClick={toggleDrawer}
        onRightIconClick={this.handleRightIconClick}
      >
        <IndexLink to="/">
          <FontIcon value="home" />
        </IndexLink>

        <FindBar
          commands={commands}
          defaultCommands={defaultCommands}
          runCommand={runCommand}
        />
        <IconMenu
          theme={styles}
          icon="create"
          onClick={this.handleCreateButtonClick}
          onHide={this.handleCreateMenuHide}
        >
          {
            collections.filter(collection => collection.get('create')).valueSeq().map(collection =>
              <MenuItem
                key={collection.get("name")}
                value={collection.get("name")}
                onClick={this.handleCreatePostClick.bind(this, collection.get('name'))} // eslint-disable-line
                caption={pluralize(collection.get("label"), 1)}
              />
            )
          }
        </IconMenu>
      </AppBar>
    );
  }
}
