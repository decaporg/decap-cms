import styled from '@emotion/styled';
import React, { useCallback, useMemo, useState } from 'react';

import { changeViewStyle, filterByField, groupByField, sortByField } from '@/core/actions/entries';
import { useCurrentUserScopes } from '@/core/hooks/useCurrentUserScopes';
import { useAppDispatch, useAppSelector } from '@/core/hooks/useRedux';
import { useTranslate } from '@/core/i18n';
import { canEditCollection } from '@/core/lib/collectionAccess';
import { useCmsSlots } from '@/core/lib/slots';
import { selectCanCreateNewEntry } from '@/core/lib/canCreateNewEntry';
import { getNewEntryUrl } from '@/core/lib/urlHelper';
import { selectSortableFields, selectViewFilters, selectViewGroups } from '@/core/reducers/collections';
import { selectEntriesFilter, selectEntriesGroup, selectEntriesSort, selectViewStyle } from '@/core/reducers/entries';
import { components, lengths } from '@/ui/default/index';
import CollectionControls from './CollectionControls';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import Sidebar from './Sidebar';

import type {
  CmsCollections,
  CmsCollectionState,
  CmsSortDirection,
  CmsViewFilter,
  CmsViewGroup,
} from '@/lib/util/index';

const CollectionContainer = styled.div`
  margin: ${lengths.pageMarginMobile};
  @media (min-width: 500px) {
    margin: ${lengths.pageMargin};
  }
`;

const CollectionMain = styled.main<{ $hasSidebar?: boolean }>`
  padding-left: ${({ $hasSidebar }) => ($hasSidebar === false ? '0' : '280px')};

  @media (max-width: 600px) {
    padding-left: 0;
  }
`;

const SearchResultContainer = styled.div`
  ${components.cardTop};
  margin-bottom: 22px;
`;

const SearchResultHeading = styled.h1`
  ${components.cardTopHeading};
`;

interface CollectionProps {
  match: {
    params: {
      name?: string | undefined,
      searchTerm?: string | undefined,
      filterTerm?: string | undefined,
    },
  };
  isSearchResults?: boolean | undefined;
  isSingleSearchResult?: boolean | undefined;
}

/**
 * Collection component - converted to functional component with Redux hooks
 * Uses useCallback for handlers and useMemo for computed values
 * NO useEffect - all side effects are handled by Redux actions
 */
function CmsCollection({
  match,
  isSearchResults = false,
  isSingleSearchResult = false,
}: CollectionProps) {
  const t = useTranslate();
  const dispatch = useAppDispatch();
  const { renderCollectionTop, renderCollectionSidebar, renderCollectionControls } = useCmsSlots();

  // Extract params from match
  const { name, searchTerm = '', filterTerm = '' } = match.params;

  // Free-text filter over the currently rendered entry list (client-side,
  // matched against each entry's inferred title/summary). Separate from
  // `searchTerm`, which drives the dedicated cross-collection search-results
  // route.
  const [searchQuery, setSearchQuery] = useState('');

  // Select state from Redux store
  const collections = useAppSelector(state => state.collections) as CmsCollections;
  const entries = useAppSelector(state => state.entries);
  const isSearchEnabled = useAppSelector(state => state.config?.search !== false);
  const userScopes = useCurrentUserScopes();

  // Get the collection
  const collection = useMemo(() => {
    if (name) {
      return collections[name];
    }
    // Get first collection
    const keys = Object.keys(collections);
    return keys.length > 0 ? collections[keys[0]] : undefined;
  }, [collections, name]) as CmsCollectionState | undefined;

  const collectionName = collection?.name || name || '';
  // `create` plus any collection `limit`.
  const canCreate = useAppSelector(state => !!collectionName && selectCanCreateNewEntry(state, collectionName));

  // Memoized selectors
  const sort = useMemo(
    () => (collectionName ? selectEntriesSort(entries, collectionName) : undefined),
    [entries, collectionName],
  );

  const sortableFields = useMemo(
    () => (collection ? selectSortableFields(collection, t) : []),
    [collection, t],
  );

  const viewFilters = useMemo(
    () => (collection ? selectViewFilters(collection) : undefined),
    [collection],
  );

  const viewGroups = useMemo(
    () => (collection ? selectViewGroups(collection) : undefined),
    [collection],
  );

  const filter = useMemo(
    () => (collectionName ? selectEntriesFilter(entries, collectionName) : undefined),
    [entries, collectionName],
  );

  const group = useMemo(
    () => (collectionName ? selectEntriesGroup(entries, collectionName) : undefined),
    [entries, collectionName],
  );

  const viewStyle = useMemo(() => selectViewStyle(entries), [entries]);

  // Compute new entry URL
  const newEntryUrl = useMemo(() => {
    if (!collection || !canCreate || !collectionName || !canEditCollection(collection, userScopes)) {
      return '';
    }
    let url = getNewEntryUrl(collectionName);
    if (filterTerm) {
      url = `${url}?path=${filterTerm}`;
    }
    return url;
  }, [collection, canCreate, collectionName, filterTerm, userScopes]);

  // Handlers using useCallback
  const onSortClick = useCallback(
    (key: string, direction: CmsSortDirection) => {
      if (collection) {
        dispatch(sortByField(collection, key, direction));
      }
    },
    [dispatch, collection],
  );

  const onFilterClick = useCallback(
    (filterValue: CmsViewFilter) => {
      if (collection) {
        dispatch(filterByField(collection, filterValue));
      }
    },
    [dispatch, collection],
  );

  const onGroupClick = useCallback(
    (groupValue: CmsViewGroup) => {
      if (collection) {
        dispatch(groupByField(collection, groupValue));
      }
    },
    [dispatch, collection],
  );

  const onChangeViewStyle = useCallback(
    (style: string) => {
      dispatch(changeViewStyle(style));
    },
    [dispatch],
  );

  // Render helpers
  const renderEntriesCollection = useCallback(() => {
    if (!collection) return null;
    return (
      <EntriesCollection
        collection={collection}
        viewStyle={viewStyle}
        filterTerm={filterTerm}
        searchQuery={searchQuery}
      />
    );
  }, [collection, viewStyle, filterTerm, searchQuery]);

  const renderEntriesSearch = useCallback(() => {
    const searchCollections = isSingleSearchResult && collection
      ? Object.fromEntries(Object.entries(collections).filter(([, c]) => c === collection))
      : collections;
    return <EntriesSearch collections={searchCollections} searchTerm={searchTerm} />;
  }, [collections, collection, isSingleSearchResult, searchTerm]);

  // Early return if no collection
  if (!collection) {
    return null;
  }

  const searchResultKey = 'collection.collectionTop.searchResults' + (isSingleSearchResult ? 'InCollection' : '');

  const sidebarProps = {
    collections,
    collection: !isSearchResults || isSingleSearchResult ? collection : undefined,
    isSearchEnabled,
    searchTerm,
    filterTerm,
    userScopes,
  };
  const sidebarNode = renderCollectionSidebar
    ? (
      renderCollectionSidebar(sidebarProps)
    )
    : <Sidebar {...sidebarProps} />;
  const hasSidebar = sidebarNode != null;

  return (
    <CollectionContainer>
      {sidebarNode}
      <CollectionMain $hasSidebar={hasSidebar}>
        {isSearchResults
          ? (
            <SearchResultContainer>
              <SearchResultHeading className="SearchResultHeading">
                {t(searchResultKey, { searchTerm, collection: collection.label })}
              </SearchResultHeading>
            </SearchResultContainer>
          )
          : (
            <>
              {renderCollectionTop
                ? (
                  renderCollectionTop({ collection, newEntryUrl, filterTerm, userScopes })
                )
                : <CollectionTop collection={collection} newEntryUrl={newEntryUrl} />}
              {renderCollectionControls
                ? (
                  renderCollectionControls({
                    viewStyle,
                    onChangeViewStyle,
                    sortableFields,
                    onSortClick,
                    sort,
                    viewFilters,
                    viewGroups,
                    onFilterClick,
                    onGroupClick,
                    filter,
                    group,
                    searchQuery,
                    onSearchChange: setSearchQuery,
                  })
                )
                : (
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
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                )}
            </>
          )}
        {isSearchResults ? renderEntriesSearch() : renderEntriesCollection()}
      </CollectionMain>
    </CollectionContainer>
  );
}

export default CmsCollection;
