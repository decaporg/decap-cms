import { css } from '@emotion/react';
import styled from '@emotion/styled';
import React from 'react';
import { shallowEqual } from 'react-redux';

import { checkBackendStatus } from '@/core/actions/status';
import { OfflineIndicator, SettingsDropdown } from '@/core/components/UI';
import { useCurrentUserScopes } from '@/core/hooks/useCurrentUserScopes';
import { useAppDispatch, useAppSelector } from '@/core/hooks/useRedux';
import { translate } from '@/core/i18n';
import { canEditCollection } from '@/core/lib/collectionAccess';
import { selectCreatableCollectionNames } from '@/core/lib/canCreateNewEntry';
import { useLocation } from '@/core/routing/context';
import { NavLink } from '@/core/routing/Link';
import {
  buttons,
  colors,
  Dropdown,
  DropdownItem,
  Icon,
  lengths,
  shadows,
  StyledDropdownButton,
  zIndex,
} from '@/ui/default/index';

import type { CmsCollections, CmsCollectionState, CmsUser } from '@/lib/util/index';
import type { TranslateFunction } from '@/ui/default/index';

type Collection = CmsCollectionState;
type Collections = CmsCollections;

const ACTIVE_CLASS_NAME = 'header-link-active';

// Below this width the nav-list + quick-add + test-backend/site-url links +
// avatar no longer fit next to each other (natural content width ≈ 720px at
// the default sizing) and force the document into horizontal scroll
// (DCMS-629). Collapse to icon-only nav buttons and hide the secondary
// "Test Backend" / site-URL links (still reachable via the settings
// dropdown avatar) so the header fits within any mobile viewport.
const MOBILE_BREAKPOINT = 700;

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

function AppHeader(props: React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      css={css`
        ${shadows.dropMain};
        width: 100%;
        background-color: ${colors.foreground};
        z-index: ${zIndex.zIndex300};
        height: ${lengths.topBarHeight};

        /* Sticking the header costs a fixed slice of the viewport (DCMS-1049,
           ported from upstream 64118e404). On a short or heavily zoomed
           viewport that slice can outweigh the convenience of a persistent
           header, so only stick it once there's enough height to spare. */
        @media (min-height: 500px) {
          position: sticky;
          top: 0;
        }
      `}
      {...props}
    />
  );
}

const AppHeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  max-width: 1440px;
  padding: 0 12px;
  margin: 0 auto;
`;

const AppHeaderButtonLabel = styled.span`
  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    display: none;
  }
`;

const AppHeaderButton = styled.button`
  ${buttons.button};
  background: none;
  color: ${colors.controlLabel};
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  display: inline-flex;
  padding: 16px 20px;
  align-items: center;

  .decap-icon {
    margin-right: 4px;
    color: ${colors.controlLabel};
  }

  &:hover,
  &:active,
  &:focus-visible {
    ${styles.buttonActive};

    .decap-icon {
      ${styles.buttonActive};
    }
  }

  &.${ACTIVE_CLASS_NAME} {
    ${styles.buttonActive};

    .decap-icon {
      ${styles.buttonActive};
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    padding: 12px;

    .decap-icon {
      margin-right: 0;
    }
  }
`;

const AppHeaderNavLink = AppHeaderButton.withComponent(NavLink);

const AppHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    /* "Test Backend" and the site-URL link are informational shortcuts,
       eating 200px+ of width they don't have on mobile. They stay reachable
       via the settings dropdown itself, so only the inline links collapse. */
    a[target='_blank'] {
      display: none;
    }
  }
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

const AppHeaderLogo = styled.li`
  display: flex;
  align-items: center;

  img {
    padding: 12px 20px;
    max-height: 56px;
    max-width: 300px;
    object-fit: contain;
    object-position: center;
  }
`;

interface HeaderProps {
  user: CmsUser;
  collections: Collections;
  onCreateEntryClick: (collectionName: string) => void;
  onLogoutClick: () => void;
  openMediaLibrary: () => void;
  hasWorkflow: boolean;
  displayUrl?: string;
  showMediaButton?: boolean;
  logoUrl?: string;
  logo?: { src: string, show_in_header?: boolean };
  isTestRepo?: boolean;
  t: TranslateFunction;
}

function Header({
  user,
  collections,
  onCreateEntryClick,
  onLogoutClick,
  openMediaLibrary,
  hasWorkflow,
  displayUrl,
  showMediaButton,
  logoUrl, // Deprecated, replaced by `logo.src`
  logo,
  isTestRepo,
  t,
}: HeaderProps) {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  // A function `className` passed to a `styled(NavLink)` is stringified by
  // emotion before NavLink can call it, so the active class was never applied.
  // Derive the active state from the current route instead.
  const contentActive = pathname === '/'
    || pathname.startsWith('/collections')
    || pathname.startsWith('/media');
  const workflowActive = pathname.startsWith('/workflow');

  React.useEffect(() => {
    const intervalId = setInterval(
      () => {
        dispatch(checkBackendStatus());
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(intervalId);
  }, [dispatch]);

  function handleCreatePostClick(collectionName: string) {
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  }

  const userScopes = useCurrentUserScopes();
  // `create` plus any collection `limit` (selectCanCreateNewEntry).
  const creatableNames = useAppSelector(selectCreatableCollectionNames, shallowEqual);
  const creatableCollections = Object.values(collections).filter(
    (collection: Collection) => creatableNames.includes(collection.name) && canEditCollection(collection, userScopes),
  );

  const shouldShowLogo = logo?.show_in_header && logo?.src;

  return (
    <AppHeader>
      <AppHeaderContent>
        <nav>
          <AppHeaderNavList>
            {shouldShowLogo && (
              <AppHeaderLogo>
                <img src={logo?.src || logoUrl} alt="Logo" />
              </AppHeaderLogo>
            )}
            <li>
              <AppHeaderNavLink
                to="/"
                className={contentActive ? ACTIVE_CLASS_NAME : undefined}
                aria-current={contentActive ? 'page' : undefined}
                aria-label={t('app.header.content')}
              >
                <Icon type="page" />
                <AppHeaderButtonLabel>{t('app.header.content')}</AppHeaderButtonLabel>
              </AppHeaderNavLink>
            </li>
            {hasWorkflow && (
              <li>
                <AppHeaderNavLink
                  to="/workflow"
                  className={workflowActive ? ACTIVE_CLASS_NAME : undefined}
                  aria-current={workflowActive ? 'page' : undefined}
                  aria-label={t('app.header.workflow')}
                >
                  <Icon type="workflow" />
                  <AppHeaderButtonLabel>{t('app.header.workflow')}</AppHeaderButtonLabel>
                </AppHeaderNavLink>
              </li>
            )}
            {showMediaButton && (
              <li>
                <AppHeaderButton onClick={openMediaLibrary} aria-label={t('app.header.media')}>
                  <Icon type="media-alt" />
                  <AppHeaderButtonLabel>{t('app.header.media')}</AppHeaderButtonLabel>
                </AppHeaderButton>
              </li>
            )}
          </AppHeaderNavList>
        </nav>
        <AppHeaderActions>
          <OfflineIndicator />
          {creatableCollections.length > 0 && (
            <Dropdown
              renderButton={() => <AppHeaderQuickNewButton>{t('app.header.quickAdd')}</AppHeaderQuickNewButton>}
              dropdownTopOverlap="30px"
              dropdownWidth="160px"
              dropdownPosition="left"
            >
              {creatableCollections.map((collection: Collection) => (
                <DropdownItem
                  key={collection.name}
                  label={collection.label_singular || collection.label}
                  onClick={() => handleCreatePostClick(collection.name)}
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
    </AppHeader>
  );
}

export default translate()(Header);
