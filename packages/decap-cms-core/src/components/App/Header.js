import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
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
  zIndex,
} from 'decap-cms-ui-default';
import { connect } from 'react-redux';

import { SettingsDropdown } from '../UI';
import { checkBackendStatus } from '../../actions/status';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

function AppHeader(props) {
  return (
    <header
      css={css`
        ${shadows.dropMain};
        position: sticky;
        width: 100%;
        top: 0;
        background-color: ${colors.foreground};
        z-index: ${zIndex.zIndex300};
        height: ${lengths.topBarHeightMobile};
        @media (min-width: 800px) {
          height: ${lengths.topBarHeight};
        }
      `}
      {...props}
    />
  );
}

const AppHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column-reverse;
  min-width: 100%;
  max-width: 1440px;
  padding: 0 12px;
  margin: 0 auto;

  @media (min-width: 800px) {
    min-width: 800px;
    flex-direction: row;
  }
`;

const AppHeaderButton = styled.button`
  ${buttons.button};
  background: none;
  color: #7b8290;
  font-family: inherit;
  font-size: clamp(14px, 1.6vw, 16px);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  padding: clamp(8px, 1.6vw, 16px) 0;

  ${Icon} {
    margin-right: 4px;
    color: #b3b9c4;
    width: clamp(20px, 2.4vw, 24px);
    height: clamp(20px, 2.4vw, 24px);
  }

  &:hover,
  &:active,
  &:focus-visible {
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
  gap: clamp(8px, 2.5vw, 20px);
`;

const AppHeaderQuickNewButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.gray};

  @media (max-width: 800px) {
    font-weight: 400;
  }

  &:after {
    top: 50%;
    transform: translateY(-50%);
  }
`;

const AppHeaderNavList = styled.ul`
  display: flex;
  gap: clamp(16px, 4vw, 60px);
  margin: 0;
  list-style: none;
`;

class Header extends React.Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    collections: ImmutablePropTypes.map.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    hasWorkflow: PropTypes.bool.isRequired,
    displayUrl: PropTypes.string,
    isTestRepo: PropTypes.bool,
    t: PropTypes.func.isRequired,
    checkBackendStatus: PropTypes.func.isRequired,
  };

  intervalId;

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Header.propTypes, this.props, 'prop', 'Header');

    this.intervalId = setInterval(() => {
      this.props.checkBackendStatus();
    }, 5 * 60 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

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
      isTestRepo,
      t,
      showMediaButton,
    } = this.props;

    const creatableCollections = collections
      .filter(collection => collection.get('create'))
      .toList();

    return (
      <AppHeader>
        <nav>
          <AppHeaderContent>
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

            <AppHeaderActions>
              {creatableCollections.size > 0 && (
                <Dropdown
                  renderButton={() => (
                    <AppHeaderQuickNewButton> {t('app.header.quickAdd')}</AppHeaderQuickNewButton>
                  )}
                  dropdownTopOverlap="30px"
                  dropdownWidth="160px"
                  dropdownPosition="left"
                >
                  {creatableCollections.map(collection => (
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
                isTestRepo={isTestRepo}
                imageUrl={user?.avatar_url}
                onLogoutClick={onLogoutClick}
              />
            </AppHeaderActions>
          </AppHeaderContent>
        </nav>
      </AppHeader>
    );
  }
}

const mapDispatchToProps = {
  checkBackendStatus,
};

export default connect(null, mapDispatchToProps)(translate()(Header));
