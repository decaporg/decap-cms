import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import { Icon, components, colors } from 'netlify-cms-ui-default';

import { searchCollections } from '../../actions/collections';
import CollectionSearch from './CollectionSearch';
import NestedCollection from './NestedCollection';
import { getAdditionalLinks, getIcon } from '../../lib/registry';

const styles = {
  sidebarNavLinkActive: css`
    color: ${colors.active};
    background-color: ${colors.activeBackground};
    border-left-color: #4863c6;
  `,
};

const SidebarContainer = styled.aside`
  ${components.card};
  width: 250px;
  padding: 8px 0 12px;
  position: fixed;
  max-height: calc(100vh - 112px);
  display: flex;
  flex-direction: column;
`;

const SidebarHeading = styled.h2`
  font-size: 23px;
  font-weight: 600;
  padding: 0;
  margin: 18px 12px 12px;
  color: ${colors.textLead};
`;

const SidebarNavList = styled.ul`
  margin: 16px 0 0;
  padding-left: 0;
  list-style: none;
  overflow: auto;
`;

const SidebarNavLink = styled(NavLink)`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px 12px;
  border-left: 2px solid #fff;
  z-index: -1;

  ${Icon} {
    margin-right: 8px;
    flex-shrink: 0;
  }

  ${props => css`
    &:hover,
    &:active,
    &.${props.activeClassName} {
      ${styles.sidebarNavLinkActive};
    }
  `};
`;

const AdditionalLink = styled.a`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px 12px;
  border-left: 2px solid #fff;
  z-index: -1;

  ${Icon} {
    margin-right: 8px;
    flex-shrink: 0;
  }

  &:hover,
  &:active {
    ${styles.sidebarNavLinkActive};
  }
`;

export class Sidebar extends React.Component {
  static propTypes = {
    collections: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map,
    isSearchEnabled: PropTypes.bool,
    searchTerm: PropTypes.string,
    filterTerm: PropTypes.string,
    t: PropTypes.func.isRequired,
  };

  renderLink = (collection, filterTerm) => {
    const collectionName = collection.get('name');
    const iconName = collection.get('icon');
    let icon = <Icon type="write" />;
    if (iconName) {
      const storedIcon = getIcon(iconName);
      if (storedIcon) {
        icon = storedIcon;
      }
    }
    if (collection.has('nested')) {
      return (
        <li key={collectionName}>
          <NestedCollection
            collection={collection}
            filterTerm={filterTerm}
            data-testid={collectionName}
          />
        </li>
      );
    }
    return (
      <li key={collectionName}>
        <SidebarNavLink
          to={`/collections/${collectionName}`}
          activeClassName="sidebar-active"
          data-testid={collectionName}
        >
          {icon}
          {collection.get('label')}
        </SidebarNavLink>
      </li>
    );
  };

  renderAdditionalLink = ({ title, url, iconName }) => {
    let icon = <Icon type="write" />;
    if (iconName) {
      const storedIcon = getIcon(iconName);
      if (storedIcon) {
        icon = storedIcon;
      }
    }
    return (
      <li key={title}>
        <AdditionalLink href={url} target="_blank" rel="noopener">
          {icon}
          {title}
        </AdditionalLink>
      </li>
    );
  };

  renderLink = (collection, filterTerm) => {
    const collectionName = collection.get('name');
    const iconName = collection.get('icon');
    let icon = <Icon type="write" />;
    if (iconName) {
      const storedIcon = getIcon(iconName);
      if (storedIcon) {
        icon = storedIcon;
      }
    }
    if (collection.has('nested')) {
      return (
        <li key={collectionName}>
          <NestedCollection
            collection={collection}
            filterTerm={filterTerm}
            data-testid={collectionName}
          />
        </li>
      );
    }
    return (
      <li key={collectionName}>
        <SidebarNavLink
          to={`/collections/${collectionName}`}
          activeClassName="sidebar-active"
          data-testid={collectionName}
        >
          {icon}
          {collection.get('label')}
        </SidebarNavLink>
      </li>
    );
  };

  render() {
    const { collections, collection, isSearchEnabled, searchTerm, t, filterTerm } = this.props;
    const additionalLinks = getAdditionalLinks();
    return (
      <SidebarContainer>
        <SidebarHeading>{t('collection.sidebar.collections')}</SidebarHeading>
        {isSearchEnabled && (
          <CollectionSearch
            searchTerm={searchTerm}
            collections={collections}
            collection={collection}
            onSubmit={(query, collection) => searchCollections(query, collection)}
          />
        )}
        <SidebarNavList>
          {collections
            .toList()
            .filter(collection => collection.get('hide') !== true)
            .map(collection => this.renderLink(collection, filterTerm))}
          {Object.values(additionalLinks).map(this.renderAdditionalLink)}
        </SidebarNavList>
      </SidebarContainer>
    );
  }
}

export default translate()(Sidebar);
