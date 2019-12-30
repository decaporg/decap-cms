import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { translate } from 'react-polyglot';
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
  mediaQueriesNoUnits,
  FloatingActionButton,
} from 'netlify-cms-ui-default';
import SettingsDropdown from 'UI/SettingsDropdown';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

const AppHeader = props => (
  <header
    css={css`
      ${shadows.dropMain};
      position: sticky;
      width: 100%;
      top: 0;
      background-color: ${colors.foreground};
      z-index: 300;
      height: ${lengths.topBarHeight};
    `}
    {...props}
  />
);

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

const AppHeaderNavList = styled.ul`
  display: flex;
  margin: 0;
  list-style: none;
`;

const Header = ({
  user,
  collections,
  onLogoutClick,
  openMediaLibrary,
  onCreateEntryClick,
  hasWorkflow,
  displayUrl,
  isTestRepo,
  showMediaButton,
  t,
}) => {
  const isClient = typeof window === 'object';
  const [isMobile, setisMobile] = useState(false);

  const handleResize = () => {
    if (window.innerWidth < mediaQueriesNoUnits.medium) {
      setisMobile(true);
    } else {
      setisMobile(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      console.info(window.innerWidth, mediaQueriesNoUnits.medium);
      if (window.innerWidth < mediaQueriesNoUnits.medium) {
        setisMobile(true);
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    console.info(`isMobile: ${isMobile}`);
  }, [isMobile]);

  const handleCreatePostClick = collectionName => {
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
          {createableCollections.size > 0 && !isMobile && (
            <Dropdown
              renderButton={() => (
                <AppHeaderQuickNewButton> {t('app.header.quickAdd')}</AppHeaderQuickNewButton>
              )}
              dropdownTopOverlap="30px"
              dropdownWidth="160px"
              dropdownPosition="left"
            >
              {createableCollections.map(collection => (
                <DropdownItem
                  key={collection.get('name')}
                  label={collection.get('label_singular') || collection.get('label')}
                  onClick={() => handleCreatePostClick(collection.get('name'))}
                />
              ))}
            </Dropdown>
          )}
          <SettingsDropdown
            displayUrl={displayUrl}
            isTestRepo={isTestRepo}
            imageUrl={user.get('avatar_url')}
            onLogoutClick={onLogoutClick}
          />
          {isMobile && <FloatingActionButton />}
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
