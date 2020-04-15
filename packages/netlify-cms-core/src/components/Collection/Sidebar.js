import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import { Icon, components, colors, colorsRaw, lengths, zIndex } from 'netlify-cms-ui-legacy';
import { searchCollections } from 'Actions/collections';

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
  overflow: auto;
`;

const SidebarHeading = styled.h2`
  font-size: 23px;
  font-weight: 600;
  padding: 0;
  margin: 18px 12px 12px;
  color: ${colors.textLead};
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 12px;
  position: relative;

  ${Icon} {
    position: absolute;
    top: 0;
    left: 6px;
    z-index: ${zIndex.zIndex2};
    height: 100%;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  background-color: #eff0f4;
  border-radius: ${lengths.borderRadius};
  font-size: 14px;
  padding: 10px 6px 10px 32px;
  width: 100%;
  position: relative;
  z-index: ${zIndex.zIndex1};

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${colorsRaw.blue};
  }
`;

const SidebarNavList = styled.ul`
  margin: 16px 0 0;
  list-style: none;
`;

const SidebarNavLink = styled(NavLink)`
  display: flex;
  font-size: 14px;
  font-weight: 500;
  align-items: center;
  padding: 8px 12px;
  border-left: 2px solid #fff;

  ${Icon} {
    margin-right: 8px;
  }

  ${props => css`
    &:hover,
    &:active,
    &.${props.activeClassName} {
      ${styles.sidebarNavLinkActive};
    }
  `};
`;

class Sidebar extends React.Component {
  static propTypes = {
    collections: ImmutablePropTypes.orderedMap.isRequired,
    searchTerm: PropTypes.string,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    searchTerm: '',
  };

  state = { query: this.props.searchTerm };

  renderLink = collection => {
    const collectionName = collection.get('name');
    return (
      <li key={collectionName}>
        <SidebarNavLink to={`/collections/${collectionName}`} activeClassName="sidebar-active">
          <Icon type="write" />
          {collection.get('label')}
        </SidebarNavLink>
      </li>
    );
  };

  render() {
    const { collections, t } = this.props;
    const { query } = this.state;

    return (
      <SidebarContainer>
        <SidebarHeading>{t('collection.sidebar.collections')}</SidebarHeading>
        <SearchContainer>
          <Icon type="search" size="small" />
          <SearchInput
            onChange={e => this.setState({ query: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && searchCollections(query)}
            placeholder={t('collection.sidebar.searchAll')}
            value={query}
          />
        </SearchContainer>
        <SidebarNavList>{collections.toList().map(this.renderLink)}</SidebarNavList>
      </SidebarContainer>
    );
  }
}

export default translate()(Sidebar);
