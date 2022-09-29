import styled from '@emotion/styled';
import React, { useCallback, useEffect, useMemo } from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { changeViewStyle, filterByField, groupByField, sortByField } from '../../actions/entries';
import { SortDirection } from '../../interface';
import { getNewEntryUrl } from '../../lib/urlHelper';
import {
  selectSortableFields,
  selectViewFilters,
  selectViewGroups,
} from '../../reducers/collections';
import {
  selectEntriesFilter,
  selectEntriesGroup,
  selectEntriesSort,
  selectViewStyle,
} from '../../reducers/entries';
import { components, lengths } from '../../ui';
import CollectionControls from './CollectionControls';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import Sidebar from './Sidebar';

import type { RouteComponentProps } from 'react-router-dom';
import type {
  CmsSortableFieldsDefault,
  TranslatedProps,
  ViewFilter,
  ViewGroup,
} from '../../interface';
import type { Collection, State } from '../../types/redux';
import type { StaticallyTypedRecord } from '../../types/immutable';

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

interface CollectionRouterParams {
  name: string;
  searchTerm?: string;
  filterTerm?: string;
}

interface CollectionViewProps extends RouteComponentProps<CollectionRouterParams> {
  isSearchResults?: boolean;
  isSingleSearchResult?: boolean;
}

const CollectionView = ({
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
}: ReturnType<typeof mergeProps>) => {
  const newEntryUrl = useMemo(() => {
    let url = collection.get('create') ? getNewEntryUrl(collectionName) : '';
    if (url && filterTerm) {
      url = getNewEntryUrl(collectionName);
      if (filterTerm) {
        url = `${newEntryUrl}?path=${filterTerm}`;
      }
    }
  }, [collection, collectionName, filterTerm]);

  const searchResultKey = useMemo(
    () => `collection.collectionTop.searchResults${isSingleSearchResult ? 'InCollection' : ''}`,
    [isSingleSearchResult],
  );

  const renderEntriesCollection = useCallback(() => {
    return (
      <EntriesCollection collection={collection} viewStyle={viewStyle} filterTerm={filterTerm} />
    );
  }, [collection, filterTerm, viewStyle]);

  const renderEntriesSearch = useCallback(() => {
    return (
      <EntriesSearch
        collections={isSingleSearchResult ? collections.filter(c => c === collection) : collections}
        searchTerm={searchTerm}
      />
    );
  }, [searchTerm, collections, collection, isSingleSearchResult]);

  useEffect(() => {
    if (sort?.first()?.get('key')) {
      return;
    }

    const defaultSort = collection.getIn(['sortable_fields', 'default']) as
      | StaticallyTypedRecord<CmsSortableFieldsDefault>
      | undefined;

    if (!defaultSort || !defaultSort.get('field')) {
      return;
    }

    onSortClick(defaultSort.get('field'), defaultSort.get('direction') ?? SortDirection.Ascending);
  }, [collection]);

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
        {isSearchResults ? renderEntriesSearch() : renderEntriesCollection()}
      </CollectionMain>
    </CollectionContainer>
  );
};

function mapStateToProps(state: State, ownProps: TranslatedProps<CollectionViewProps>) {
  const { collections } = state;
  const isSearchEnabled = state.config && state.config.search != false;
  const { isSearchResults, match, t } = ownProps;
  const { name, searchTerm = '', filterTerm = '' } = match.params;
  const collection: Collection = name ? collections.get(name) : collections.first();
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

function mergeProps(
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
  ownProps: TranslatedProps<CollectionViewProps>,
) {
  return {
    ...stateProps,
    ...ownProps,
    onSortClick: (key: string, direction: SortDirection) =>
      dispatchProps.sortByField(stateProps.collection, key, direction),
    onFilterClick: (filter: ViewFilter) =>
      dispatchProps.filterByField(stateProps.collection, filter),
    onGroupClick: (group: ViewGroup) => dispatchProps.groupByField(stateProps.collection, group),
    onChangeViewStyle: (viewStyle: string) => dispatchProps.changeViewStyle(viewStyle),
  };
}

const ConnectedCollection = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(CollectionView);

export default translate()(ConnectedCollection);
