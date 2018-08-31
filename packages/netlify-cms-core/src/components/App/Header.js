import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled, { css } from 'react-emotion';
import { NavLink } from 'react-router-dom';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colors,
  lengths,
  shadows,
  buttons,
} from 'netlify-cms-ui-default';
import SettingsDropdown from 'UI/SettingsDropdown';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

const AppHeaderContainer = styled.header`
  z-index: 300;
`;

const AppHeader = styled.div`
  ${shadows.dropMain};
  position: fixed;
  width: 100%;
  top: 0;
  background-color: ${colors.foreground};
  z-index: 300;
  height: ${lengths.topBarHeight};
`;

const AppHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  min-width: 800px;
  max-width: 1440px;
  padding: 0 12px;
  margin: 0 auto;
`;

const AppHeaderButton = styled.button`
  ${buttons.button};
  background: none;
  color: #7b8290;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  display: inline-flex;
  padding: 16px 20px;
  align-items: center;

  ${Icon} {
    margin-right: 4px;
    color: #b3b9c4;
  }

  &:hover,
  &:active,
  &:focus {
    ${styles.buttonActive};

    ${Icon} {
      ${styles.buttonActive};
    }
  }

  ${props => css`
    &.${props.activeClassName} {
      ${styles.buttonActive};

      ${Icon} {
        ${styles.buttonActive};
      }
    }
  `};
`;

const AppHeaderNavLink = AppHeaderButton.withComponent(NavLink);

const AppHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
`;

const AppHeaderQuickNewButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.gray};
  margin-right: 8px;

  &:after {
    top: 11px;
  }
`;

export default class Header extends React.Component {
  static propTypes = {
    user: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.orderedMap.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    hasWorkflow: PropTypes.bool.isRequired,
    displayUrl: PropTypes.string,
  };

  handleCreatePostClick = collectionName => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  render() {
    const {
      user,
      collections,
      onLogoutClick,
      openMediaLibrary,
      hasWorkflow,
      displayUrl,
      showMediaButton,
    } = this.props;

    const createableCollections = collections
      .filter(collection => collection.get('create'))
      .toList();

    return (
      <AppHeaderContainer>
        <AppHeader>
          <AppHeaderContent>
            <nav>
              <AppHeaderNavLink
                to="/"
                activeClassName="header-link-active"
                isActive={(match, location) => location.pathname.startsWith('/collections/')}
              >
                <Icon type="page" />
                Content
              </AppHeaderNavLink>
              {hasWorkflow ? (
                <AppHeaderNavLink to="/workflow" activeClassName="header-link-active">
                  <Icon type="workflow" />
                  Workflow
                </AppHeaderNavLink>
              ) : null}
              {showMediaButton ? (
                <AppHeaderButton onClick={openMediaLibrary}>
                  <Icon type="media-alt" />
                  Media
                </AppHeaderButton>
              ) : null}
            </nav>
            <AppHeaderActions>
              {createableCollections.size > 0 && (
                <Dropdown
                  renderButton={() => <AppHeaderQuickNewButton>Quick add</AppHeaderQuickNewButton>}
                  dropdownTopOverlap="30px"
                  dropdownWidth="160px"
                  dropdownPosition="left"
                >
                  {createableCollections.map(collection => (
                    <DropdownItem
                      key={collection.get('name')}
                      label={collection.get('label_singular') || collection.get('label')}
                      onClick={() => this.handleCreatePostClick(collection.get('name'))}
                    />
                  ))}
                </Dropdown>
              )}
              <SettingsDropdown
                displayUrl={displayUrl}
                imageUrl={user.get('avatar_url')}
                onLogoutClick={onLogoutClick}
              />
            </AppHeaderActions>
          </AppHeaderContent>
        </AppHeader>
      </AppHeaderContainer>
    );
  }
}
