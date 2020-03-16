import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import { Icon, colors, lengths, shadows, buttons } from 'netlify-cms-ui-legacy';
import SettingsDropdown from 'UI/SettingsDropdown';
import { Button, ButtonGroup, Menu, MenuItem } from 'netlify-cms-ui-default';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

const AppHeader = styled.header`
  ${shadows.dropMain};
  position: sticky;
  width: 100%;
  top: 0;
  background-color: ${({ theme }) => theme.color.surface};
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

const AppHeaderNavList = styled.ul`
  display: flex;
  margin: 0;
  list-style: none;
`;

const Header = ({
  user,
  collections,
  onLogoutClick,
  onCreateEntryClick,
  openMediaLibrary,
  hasWorkflow,
  displayUrl,
  isTestRepo,
  t,
  showMediaButton,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState();
  const handleCreatePostClick = collectionName => {
    setMenuAnchorEl(null);
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };
  const createableCollections = collections.filter(collection => collection.get('create')).toList();
  return (
    <AppHeader>
      <AppHeaderContent>
        <nav>
          <AppHeaderNavList>
            <li>
              <AppHeaderNavLink
                to="/"
                activeClassName="header-link-active"
                isActive={(match, location) => location.pathname.startsWith('/collections/')}
              >
                <Icon type="page" />
                {t('app.header.content')}
              </AppHeaderNavLink>
            </li>
            {hasWorkflow && (
              <li>
                <AppHeaderNavLink to="/workflow" activeClassName="header-link-active">
                  <Icon type="workflow" />
                  {t('app.header.workflow')}
                </AppHeaderNavLink>
              </li>
            )}
            {showMediaButton && (
              <li>
                <AppHeaderButton onClick={openMediaLibrary}>
                  <Icon type="media-alt" />
                  {t('app.header.media')}
                </AppHeaderButton>
              </li>
            )}
          </AppHeaderNavList>
        </nav>
        <AppHeaderActions>
          {createableCollections.size > 0 && (
            <>
              <ButtonGroup>
                <Button primary onClick={e => setMenuAnchorEl(e.currentTarget)} hasMenu>
                  {t('app.header.quickAdd')}
                </Button>
              </ButtonGroup>
              <Menu
                anchorEl={menuAnchorEl}
                open={!!menuAnchorEl}
                onClose={() => setMenuAnchorEl(null)}
              >
                {createableCollections.map(collection => (
                  <MenuItem
                    key={collection.get('name')}
                    onClick={() => handleCreatePostClick(collection.get('name'))}
                  >
                    {collection.get('label_singular') || collection.get('label')}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
          <SettingsDropdown
            displayUrl={displayUrl}
            isTestRepo={isTestRepo}
            imageUrl={user.get('avatar_url')}
            onLogoutClick={onLogoutClick}
          />
        </AppHeaderActions>
      </AppHeaderContent>
    </AppHeader>
  );
};

Header.propTypes = {
  user: ImmutablePropTypes.map.isRequired,
  collections: ImmutablePropTypes.orderedMap.isRequired,
  onCreateEntryClick: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  openMediaLibrary: PropTypes.func.isRequired,
  hasWorkflow: PropTypes.bool.isRequired,
  displayUrl: PropTypes.string,
  isTestRepo: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default translate()(Header);
