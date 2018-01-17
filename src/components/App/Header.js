import PropTypes from 'prop-types';
import React from "react";
import ImmutablePropTypes from "react-immutable-proptypes";
import { NavLink } from 'react-router-dom';
import { Icon, Dropdown, DropdownItem } from 'UI';
import { stripProtocol } from 'Lib/urlHelper';
import i18n from '../../i18n';

export default class Header extends React.Component {
  static propTypes = {
    user: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
    displayUrl: PropTypes.string,
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
      toggleDrawer,
      onLogoutClick,
      openMediaLibrary,
      hasWorkflow,
      displayUrl,
    } = this.props;

    const avatarUrl = user.get('avatar_url');

    return (
      <div className="nc-appHeader-container">
        <div className="nc-appHeader-main">
          <div className="nc-appHeader-content">
            <nav>
              <NavLink
                to="/"
                className="nc-appHeader-button"
                activeClassName="nc-appHeader-button-active"
                isActive={(match, location) => location.pathname.startsWith('/collections/')}
              >
                <Icon type="page"/>
                {i18n.t("content")}
              </NavLink>
              {
                hasWorkflow
                  ? <NavLink to="/workflow" className="nc-appHeader-button" activeClassName="nc-appHeader-button-active">
                      <Icon type="workflow"/>
                      {i18n.t("workflow")}
                    </NavLink>
                  : null
              }
              <button onClick={openMediaLibrary} className="nc-appHeader-button">
                <Icon type="media-alt"/>
                {i18n.t("media")}
              </button>
            </nav>
            <div className="nc-appHeader-actions">
              <Dropdown
                classNameButton="nc-appHeader-button nc-appHeader-quickNew"
                label={i18n.t("quickadd")}
                dropdownTopOverlap="30px"
                dropdownWidth="160px"
                dropdownPosition="left"
              >
                {
                  collections.filter(collection => collection.get('create')).toList().map(collection =>
                    <DropdownItem
                      key={collection.get("name")}
                      label={collection.get("label")}
                      onClick={() => this.handleCreatePostClick(collection.get('name'))}
                    />
                  )
                }
              </Dropdown>
              {
                displayUrl
                  ? <a
                      className="nc-appHeader-siteLink"
                      href={displayUrl}
                      target="_blank"
                    >
                      {stripProtocol(displayUrl)}
                    </a>
                  : null
              }
              <Dropdown
                dropdownTopOverlap="50px"
                dropdownWidth="100px"
                dropdownPosition="right"
                button={
                  <button className="nc-appHeader-avatar">
                    {
                      avatarUrl
                        ? <img className="nc-appHeader-avatar-image" src={user.get('avatar_url')}/>
                        : <Icon className="nc-appHeader-avatar-placeholder" type="user" size="large"/>
                    }
                  </button>
                }
              >
                <DropdownItem label={i18n.t("logout")} onClick={onLogoutClick}/>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
