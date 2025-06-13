import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { translate } from 'react-polyglot';
import { lengths, components } from 'decap-cms-ui-default';

import { getNewEntryUrl } from '../../lib/urlHelper';
import Sidebar from './Sidebar';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import CollectionControls from './CollectionControls';
import { sortByField, filterByField, changeViewStyle, groupByField } from '../../actions/entries';
import {
  selectSortableFields,
  selectViewFilters,
  selectViewGroups,
} from '../../reducers/collections';
import {
  selectEntriesSort,
  selectEntriesFilter,
  selectEntriesGroup,
  selectViewStyle,
} from '../../reducers/entries';

const CollectionContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

const CollectionMain = styled.main`
  padding-left: 280px;
`;

const SearchResultContainer = styled.div`
  ${components.cardTop};
  margin-bottom: 22px;
`;

const SearchResultHeading = styled.h1`
  ${components.cardTopHeading};
`;

export class Collection extends React.Component {
  static propTypes = {
    searchTerm: PropTypes.string,
    collectionName: PropTypes.string,
    isSearchResults: PropTypes.bool,
    isSingleSearchResult: PropTypes.bool,
    collection: ImmutablePropTypes.map.isRequired,
    collections: ImmutablePropTypes.map.isRequired,
    sortableFields: PropTypes.array,
    sort: ImmutablePropTypes.orderedMap,
    onSortClick: PropTypes.func.isRequired,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Collection.propTypes, this.props, 'prop', 'Collection');
  }

  renderEntriesCollection = () => {
    const { collection, filterTerm, viewStyle } = this.props;
    return (
      <EntriesCollection collection={collection} viewStyle={viewStyle} filterTerm={filterTerm} />
    );
  };

  renderEntriesSearch = () => {
    const { searchTerm, collections, collection, isSingleSearchResult } = this.props;
    return (
      <EntriesSearch
        collections={isSingleSearchResult ? collections.filter(c => c === collection) : collections}
        searchTerm={searchTerm}
      />
    );
  };

  render() {
    const {
      collection,
      collections,
      collectionName,
      isSearchEnabled,
      isSearchResults,
      isSingleSearchResult,
      searchTerm,
      sortableFields,
      onSortClick,
      sort,
      viewFilters,
      viewGroups,
      filterTerm,
      t,
      onFilterClick,
      onGroupClick,
      filter,
      group,
      onChangeViewStyle,
      viewStyle,
    } = this.props;

    let newEntryUrl = collection.get('create') ? getNewEntryUrl(collectionName) : '';
    if (newEntryUrl && filterTerm) {
      newEntryUrl = getNewEntryUrl(collectionName);
      if (filterTerm) {
        newEntryUrl = `${newEntryUrl}?path=${filterTerm}`;
      }
    }

    const searchResultKey =
      'collection.collectionTop.searchResults' + (isSingleSearchResult ? 'InCollection' : '');

    return (
      <CollectionContainer>
        <Sidebar
          collections={collections}
          collection={(!isSearchResults || isSingleSearchResult) && collection}
          isSearchEnabled={isSearchEnabled}
          searchTerm={searchTerm}
          filterTerm={filterTerm}
        />
        <CollectionMain>
          {isSearchResults ? (
            <SearchResultContainer>
              <SearchResultHeading>
                {t(searchResultKey, { searchTerm, collection: collection.get('label') })}
              </SearchResultHeading>
            </SearchResultContainer>
          ) : (
            <>
              <CollectionTop collection={collection} newEntryUrl={newEntryUrl} />
              <CollectionControls
                viewStyle={viewStyle}
                onChangeViewStyle={onChangeViewStyle}
                sortableFields={sortableFields}
                onSortClick={onSortClick}
                sort={sort}
                viewFilters={viewFilters}
                viewGroups={viewGroups}
                t={t}
                onFilterClick={onFilterClick}
                onGroupClick={onGroupClick}
                filter={filter}
                group={group}
              />
            </>
          )}
          {isSearchResults ? this.renderEntriesSearch() : this.renderEntriesCollection()}
        </CollectionMain>
      </CollectionContainer>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const isSearchEnabled = state.config && state.config.search != false;
  const { isSearchResults, match, t } = ownProps;
  const { name, searchTerm = '', filterTerm = '' } = match.params;
  const collection = name ? collections.get(name) : collections.first();
  const sort = selectEntriesSort(state.entries, collection.get('name'));
  const sortableFields = selectSortableFields(collection, t);
  const viewFilters = selectViewFilters(collection);
  const viewGroups = selectViewGroups(collection);
  const filter = selectEntriesFilter(state.entries, collection.get('name'));
  const group = selectEntriesGroup(state.entries, collection.get('name'));
  const viewStyle = selectViewStyle(state.entries);

  return {
    collection,
    collections,
    collectionName: name,
    isSearchEnabled,
    isSearchResults,
    searchTerm,
    filterTerm,
    sort,
    sortableFields,
    viewFilters,
    viewGroups,
    filter,
    group,
    viewStyle,
  };
}

const mapDispatchToProps = {
  sortByField,
  filterByField,
  changeViewStyle,
  groupByField,
};

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...stateProps,
    ...ownProps,
    onSortClick: (key, direction) =>
      dispatchProps.sortByField(stateProps.collection, key, direction),
    onFilterClick: filter => dispatchProps.filterByField(stateProps.collection, filter),
    onGroupClick: group => dispatchProps.groupByField(stateProps.collection, group),
    onChangeViewStyle: viewStyle => dispatchProps.changeViewStyle(viewStyle),
  };
}

const ConnectedCollection = connect(mapStateToProps, mapDispatchToProps, mergeProps)(Collection);

export default translate()(ConnectedCollection);
