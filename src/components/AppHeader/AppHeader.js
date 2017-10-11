import PropTypes from 'prop-types';
import React from "react";
import ImmutablePropTypes from "react-immutable-proptypes";
import { Link } from 'react-router-dom';
import { IconMenu, Menu, MenuItem } from "react-toolbox/lib/menu";
import Avatar from "react-toolbox/lib/avatar";
import AppBar from "react-toolbox/lib/app_bar";
import FontIcon from "react-toolbox/lib/font_icon";
import FindBar from "../FindBar/FindBar";
import { stringToRGB } from "../../lib/textHelper";


export default class AppHeader extends React.Component {

  static propTypes = {
    user: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
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

  render() {
    const {
      user,
      collections,
      runCommand,
      toggleDrawer,
      onLogoutClick,
    } = this.props;

    const avatarStyle = {
      backgroundColor: `#${ stringToRGB(user.get("name")) }`,
    };

    const theme = {
      appBar: 'nc-appHeader-appBar',
      homeLink: 'nc-appHeader-homeLink',
      iconMenu: 'nc-appHeader-iconMenu',
      icon: 'nc-appHeader-icon',
      leftIcon: 'nc-appHeader-leftIcon',
      base: 'nc-theme-base',
      container: 'nc-theme-container',
      rounded: 'nc-theme-rounded',
      depth: 'nc-theme-depth',
      clearfix: 'nc-theme-clearfix',
    };

    return (
      <AppBar
        fixed
        theme={theme}
        leftIcon="menu"
        onLeftIconClick={toggleDrawer}
        onRightIconClick={this.handleRightIconClick}
      >
        <Link to="/" className="nc-appHeader-homeLink">
          <FontIcon value="home" className="nc-appHeader-icon" />
        </Link>
        <IconMenu
          theme={theme}
          icon="add"
          onClick={this.handleCreateButtonClick}
          onHide={this.handleCreateMenuHide}
        >
          {
            collections.filter(collection => collection.get('create')).valueSeq().map(collection =>
              <MenuItem
                key={collection.get("name")}
                value={collection.get("name")}
                onClick={this.handleCreatePostClick.bind(this, collection.get('name'))} // eslint-disable-line
                caption={collection.get("label")}
              />
            )
          }
        </IconMenu>
        <FindBar runCommand={runCommand} />
        <Avatar style={avatarStyle} title={user.get("name")} image={user.get("avatar_url")} />
        <IconMenu icon="settings" position="topRight" theme={theme}>
          <MenuItem onClick={onLogoutClick} value="log out" caption="Log Out" />
        </IconMenu>
      </AppBar>
    );
  }
}
