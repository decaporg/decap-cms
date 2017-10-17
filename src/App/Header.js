import PropTypes from 'prop-types';
import React from "react";
import ImmutablePropTypes from "react-immutable-proptypes";
import { NavLink } from 'react-router-dom';
import Icon from '../icons/Icon';

export default class Header extends React.Component {

  static propTypes = {
    user: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
  };

  render() {
    const {
      user,
      collections,
      toggleDrawer,
      onLogoutClick,
      openMediaLibrary,
    } = this.props;

    /**
     * preserve the Quick New dropdown code
    {
      collections.filter(collection => collection.get('create')).toList().map(collection =>
        <MenuItem
          key={collection.get("name")}
          value={collection.get("name")}
          onClick={this.handleCreatePostClick.bind(this, collection.get('name'))} // eslint-disable-line
          caption={collection.get("label")}
        />
      )
    }
          <MenuItem onClick={onLogoutClick} value="log out" caption="Log Out" />


          handleCreatePostClick = (collectionName) => {
            const { onCreateEntryClick } = this.props;
            if (onCreateEntryClick) {
              onCreateEntryClick(collectionName);
            }
          };

    */

    return (
      <div className="nc-appHeader-container">
        <nav>
          <NavLink to="/" className="nc-appHeader-button" activeClassName="nc-appHeader-button-active">
            <Icon type="page"/>
            Content
          </NavLink>
          <button onClick={openMediaLibrary} className="nc-appHeader-button">
            <Icon type="media-alt"/>
            Media
          </button>
        </nav>
        <div className="nc-appHeader-actions">
          <button className="nc-appHeader-button nc-appHeader-quickNew">
            Quick new
          </button>
          <a className="nc-appHeader-siteLink" href="http://olddvdscreensaver.com" target="_blank">
            olddvdscreensaver.com
          </a>
          <button className="nc-appHeader-avatar">
            <img src={user.get('avatar_url')}/>
          </button>
        </div>
      </div>
    );
  }
}
