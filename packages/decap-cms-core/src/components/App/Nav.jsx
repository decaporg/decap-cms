import React, { useMemo } from 'react';
import { translate } from 'react-polyglot';
import { NavLink as ReactRouterNavLink, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  NavMenu,
  NavMenuItem,
  NavMenuGroup,
  NavMenuGroupLabel,
  DecapMark,
} from 'decap-cms-ui-next';

import NestedCollection from '../Collection/NestedCollection';

const StyledCustomLogo = styled.img`
  width: 20px;
  margin: 0.375rem;
`;

function Nav({ collections, resources, showMediaButton, hasWorkflow, siteUrl, logoUrl, t }) {
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

  return (
    <NavMenu collapsable={true}>
      <NavMenuItem
        href={siteUrl}
        target="_blank"
        icon={logoUrl ? <StyledCustomLogo src={logoUrl} /> : <DecapMark size="20" />}
      >
        My Website
      </NavMenuItem>

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
            icon="image"
          >
            Media
          </NavMenuItem>
        )}
      </NavMenuGroup>

      <NavMenuGroup>
        <NavMenuGroupLabel>{t('collection.sidebar.collections')}</NavMenuGroupLabel>

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

      <NavMenuGroup end>
        <NavMenuGroupLabel>{t('collection.sidebar.resources')}</NavMenuGroupLabel>

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
    </NavMenu>
  );
}

export default translate()(Nav);
