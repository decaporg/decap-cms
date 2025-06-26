import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import { Icon, components, colors } from 'decap-cms-ui-default';

import { searchCollections } from '../../actions/collections';
import CollectionSearch from './CollectionSearch';
import NestedCollection from './NestedCollection';

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
  font-size: 22px;
  font-weight: 600;
  line-height: 37px;
  padding: 0;
  margin: 10px 20px;
  color: ${colors.textLead};
`;

const SidebarNavList = styled.ul`
  margin: 12px 0 0;
  list-style: none;
  overflow: auto;
`;

const SidebarNavLink = styled(NavLink)`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px 18px;
  border-left: 2px solid #fff;
  z-index: -1;

  ${Icon} {
    margin-right: 4px;
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

export class Sidebar extends React.Component {
  static propTypes = {
    collections: ImmutablePropTypes.map.isRequired,
    collection: ImmutablePropTypes.map,
    isSearchEnabled: PropTypes.bool,
    searchTerm: PropTypes.string,
    filterTerm: PropTypes.string,
    t: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Sidebar.propTypes, this.props, 'prop', 'Sidebar');
  }

  renderLink = (collection, filterTerm) => {
    const collectionName = collection.get('name');
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
          <Icon type="write" />
          {collection.get('label')}
        </SidebarNavLink>
      </li>
    );
  };

  render() {
    const { collections, collection, isSearchEnabled, searchTerm, t, filterTerm } = this.props;
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
        </SidebarNavList>
      </SidebarContainer>
    );
  }
}

export default translate()(Sidebar);
