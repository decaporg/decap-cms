import React, { useMemo } from 'react';
import { translate } from 'react-polyglot';
import { NavLink as ReactRouterNavLink, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import color from 'color';
import {
  NavMenu,
  NavMenuItem,
  NavMenuGroup,
  NavMenuGroupLabel,
  ExternalLinkIcon,
  Logo,
} from 'decap-cms-ui-next';

const StyledSiteLink = styled.a`
  width: 100%;
  display: flex;
  align-items: center;
  height: 3rem;
  padding: 0 12px;
  cursor: pointer;
`;

const SiteContents = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
  color: ${({ theme, active }) =>
    active ? theme.color.success['900'] : theme.color.mediumEmphasis};
  background-color: ${({ theme, active }) =>
    active ? color(theme.color.success['900']).alpha(0.1).string() : `transparent`};
  border: none;
  height: 2.5rem;
  border-radius: 6px;
  outline: none;
  transition: 200ms;
  ${StyledSiteLink}:hover & {
    color: ${({ theme, active }) =>
      active ? theme.color.success['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['900']).alpha(0.1).string()
        : color(theme.color.highEmphasis).alpha(0.05).string()};
    ${({ active }) =>
      active
        ? `
      cursor: default;
    `
        : ``}
  }
`;
const StyledLogo = styled(Logo)`
  margin: 0.375rem;
`;
const SiteName = styled.span`
  margin-left: 0.75rem;
  display: flex;
  flex: 1;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: ${({ collapsed }) => (collapsed ? '0' : '1')};
  transition: opacity 200ms;
`;
const StyledExternalLinkIcon = styled(ExternalLinkIcon)`
  margin-right: 0.5rem;
`;

function Nav({
  collections,
  openMediaLibrary,
  showMediaButton,
  hasWorkflow,
  siteUrl,
  displayUrl,
  logoUrl,
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

  const startCollections = collections
    .filter(collection => collection.get('position') !== 'end')
    .toList();
  const endCollections = collections
    .filter(collection => collection.get('position') === 'end')
    .toList();

  function isExternalResource(collection) {
    return collection.get('url');
  }

  return (
    <NavMenu collapsable={true}>
      <StyledSiteLink href={siteUrl} target="_blank">
        <SiteContents>
          <StyledLogo src={logoUrl} />
          <SiteName>My Website</SiteName>
          <StyledExternalLinkIcon />
        </SiteContents>
      </StyledSiteLink>

      <NavMenuGroup>
        <NavMenuItem
          as={ReactRouterNavLink}
          to={'/dashboard'}
          active={activeNavLinkId === 'dashboard'}
          onClick={() => false}
          icon="layout"
        >
          Dashboard
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
            onClick={openMediaLibrary}
            icon="image"
          >
            Media
          </NavMenuItem>
        )}
      </NavMenuGroup>

      <NavMenuGroup>
        <NavMenuGroupLabel>{t('collection.sidebar.collections')}</NavMenuGroupLabel>

        {startCollections.map(collection => {
          const collectionName = collection.get('name');

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

      <NavMenuGroup end>
        {endCollections.map(collection => {
          const collectionName = collection.get('name');

          return (
            <NavMenuItem
              as={isExternalResource(collection) ? null : ReactRouterNavLink}
              href={isExternalResource(collection) ? collection.get('url') : null}
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
    </NavMenu>
  );
}

export default translate()(Nav);
