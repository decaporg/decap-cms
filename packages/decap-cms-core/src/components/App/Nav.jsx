import React, { useMemo, useState } from 'react';
import { translate } from 'react-polyglot';
import { NavLink as ReactRouterNavLink, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  AvatarButton,
  IconButton,
  NavMenu,
  NavMenuItem,
  NavMenuSeparator,
  NavMenuGroup,
  NavMenuGroupLabel,
  DecapMark,
  useUIContext,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  SearchBar,
  Badge,
} from 'decap-cms-ui-next';

import { createNewEntry, searchCollections } from '../../actions/collections';
import NestedCollection from '../Collection/NestedCollection';

const StyledCustomLogo = styled.img`
  width: 20px;
  margin-left: 0.375rem;
`;

const StyledVersionBadge = styled(Badge)`
  margin-right: 0.375rem;
`;

const StyledAvatarButton = styled(AvatarButton)`
  margin: 0.375rem;
`;

const QuickAddButton = styled(Button)`
  display: flex;
  align-items: center;
  flex: 1;
  width: calc(100% - 24px);
  margin: auto;

  & > svg:last-child {
    margin-left: auto;
  }
`;

const QuickAddIconButton = styled(IconButton)`
  margin: auto;
`;

const StyledSearchBar = styled(SearchBar)`
  margin: 0 auto 8px auto;
  min-width: 0;
  width: calc(100% - 24px);

  & > svg {
    left: 0.35rem;
  }
`;

function Nav({
  collections,
  resources,
  showMediaButton,
  hasWorkflow,
  defaultPath,
  logoUrl,
  appName,
  user,
  onLogoutClick,
  t,
}) {
  const { pathname } = useLocation();

  const { activeNavLinkId } = useMemo(() => {
    const pathnameArray = pathname.split('/');

    if (pathnameArray.length === 0) {
      return { activeNavLinkId: 'dashboard' };
    }

    if (pathnameArray[1] === 'collections') {
      return { activeNavLinkId: `collections-${pathnameArray[2]}` };
    }

    return { activeNavLinkId: pathnameArray[1] };
  }, [pathname]);

  const creatableCollections = collections.filter(collection => collection.get('create')).toList();
  const [searchTerm, setSearchTerm] = useState('');
  const { darkMode, setDarkMode, navCollapsed, setNavCollapsed } = useUIContext();

  return (
    <NavMenu collapsable={true}>
      <NavMenuItem
        as={ReactRouterNavLink}
        to={defaultPath}
        icon={logoUrl ? <StyledCustomLogo src={logoUrl} /> : <DecapMark size="20" />}
        endIcon={
          <StyledVersionBadge variant="outline" radius="full">
            v4.0
          </StyledVersionBadge>
        }
      >
        {!navCollapsed && appName}
      </NavMenuItem>

      <NavMenuGroup>
        <StyledSearchBar
          placeholder={!navCollapsed && t('app.header.search')}
          onChange={event => setSearchTerm(event.currentTarget.value)}
          onFocus={() => setNavCollapsed(false)}
          onSubmit={() => searchCollections(searchTerm)}
        />

        <Dropdown>
          <DropdownTrigger>
            {navCollapsed ? (
              <QuickAddIconButton icon="plus" />
            ) : (
              <QuickAddButton type="neutral" variant="soft" icon="plus" hasMenu>
                {t('app.header.quickAdd')}
              </QuickAddButton>
            )}
          </DropdownTrigger>

          <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'left' }}>
            {creatableCollections.map(collection => (
              <DropdownMenuItem
                key={collection.get('name')}
                icon={collection.get('icon') || 'file-text'}
                onClick={() => {
                  createNewEntry(collection.get('name'));
                }}
              >
                {t('collection.collectionTop.newButton', {
                  collectionLabel: collection.get('label_singular') || collection.get('label'),
                })}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </NavMenuGroup>

      <NavMenuGroup>
        <NavMenuItem
          as={ReactRouterNavLink}
          to={'/dashboard'}
          active={activeNavLinkId === 'dashboard'}
          onClick={() => false}
          icon="layout"
        >
          {t('app.header.dashboard')}
        </NavMenuItem>

        {hasWorkflow && (
          <NavMenuItem
            as={ReactRouterNavLink}
            to={'/workflow'}
            active={activeNavLinkId === 'workflow'}
            icon="workflow"
          >
            {t('app.header.workflow')}
          </NavMenuItem>
        )}

        {showMediaButton && (
          <NavMenuItem
            as={ReactRouterNavLink}
            to={'/media'}
            active={activeNavLinkId === 'media'}
            icon="image"
          >
            Media
          </NavMenuItem>
        )}
      </NavMenuGroup>

      <NavMenuGroup>
        <NavMenuGroupLabel>{t('app.header.collections')}</NavMenuGroupLabel>

        {collections
          .toList()
          .filter(collection => collection.get('hide') !== true)
          .map(collection => {
            const collectionName = collection.get('name');

            if (collection.has('nested')) {
              return (
                <li key={collectionName}>
                  <NestedCollection collection={collection} data-testid={collectionName} />
                </li>
              );
            }

            return (
              <NavMenuItem
                as={ReactRouterNavLink}
                to={`/collections/${collectionName}`}
                key={`collections-${collectionName}`}
                active={activeNavLinkId === `collections-${collectionName}`}
                icon={
                  collection.get('icon') ??
                  (collection.get('type') === 'file_based_collection' ? 'file' : 'folder')
                }
              >
                {collection.get('label')}
              </NavMenuItem>
            );
          })}
      </NavMenuGroup>

      {resources.size > 0 && (
        <>
          <NavMenuGroup>
            <NavMenuGroupLabel>{t('app.header.resources')}</NavMenuGroupLabel>

            {resources.toList().map(resource => {
              return (
                <NavMenuItem
                  href={resource.get('url')}
                  key={`resources-${resource.get('name')}`}
                  icon={resource.get('icon') ?? 'link'}
                >
                  {resource.get('label')}
                </NavMenuItem>
              );
            })}
          </NavMenuGroup>
        </>
      )}

      <NavMenuGroup end>
        <NavMenuItem icon="file-text" href="https://www.decapcms.org/docs/">
          {t('app.header.documentation')}
        </NavMenuItem>

        <NavMenuItem href="https://www.decapcms.org/community/" icon="help-circle">
          {t('app.header.help')}
        </NavMenuItem>
      </NavMenuGroup>

      <NavMenuSeparator />

      <Dropdown>
        <DropdownTrigger>
          <NavMenuItem
            icon={<StyledAvatarButton src={user?.avatar_url} fallback={user?.name} size="xs" />}
            endIcon="more-vertical"
          >
            {user?.name || user?.username}
          </NavMenuItem>
        </DropdownTrigger>

        <DropdownMenu
          anchorOrigin={{ y: 'top', x: 'left' }}
          transformOrigin={{ y: 'top', x: 'left' }}
        >
          <DropdownMenuItem
            icon="moon"
            selected={darkMode}
            onClick={() => {
              setDarkMode(!darkMode);
            }}
          >
            {t('ui.settingsDropdown.darkMode')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem icon="log-out" onClick={onLogoutClick}>
            {t('ui.settingsDropdown.logOut')}
          </DropdownMenuItem>
        </DropdownMenu>
      </Dropdown>
    </NavMenu>
  );
}

export default translate()(Nav);
