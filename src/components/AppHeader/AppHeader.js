import PropTypes from 'prop-types';
import React from "react";
import ImmutablePropTypes from "react-immutable-proptypes";
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
    runCommand: PropTypes.func.isRequired,
    toggleDrawer: PropTypes.func.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
  };

  handleCreatePostClick = (collectionName) => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  render() {
    const {
      user,
      collections,
      runCommand,
      toggleDrawer,
      onLogoutClick,
      openMediaLibrary,
    } = this.props;

    const avatarStyle = {
      backgroundColor: `#${ stringToRGB(user.get("name")) }`,
    };

    return (
      <AppBar
        fixed
        theme={styles}
        leftIcon="menu"
        onLeftIconClick={toggleDrawer}
      >
        <IndexLink to="/" className={styles.button}>
          <FontIcon value="home" className={styles.icon} />
        </IndexLink>
        <button onClick={openMediaLibrary} className={styles.button}>
          <FontIcon value="perm_media" className={styles.icon} />
        </button>
        <IconMenu icon="add" theme={styles}>
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
        <IconMenu icon="settings" position="topRight" theme={styles}>
          <MenuItem onClick={onLogoutClick} value="log out" caption="Log Out" />
        </IconMenu>
      </AppBar>
    );
  }
}
