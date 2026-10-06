import { useCallback, useMemo } from 'react';

import { changeViewStyle, filterByField, groupByField, sortByField } from '@/core/actions/entries';
import { getNewEntryUrl } from '@/core/lib/urlHelper';
import { selectSortableFields, selectViewFilters, selectViewGroups } from '@/core/reducers/collections';
import { selectEntriesFilter, selectEntriesGroup, selectEntriesSort, selectViewStyle } from '@/core/reducers/entries';
import { selectCanCreateNewEntry } from '@/core/lib/canCreateNewEntry';
import { useAppDispatch, useAppSelector } from './useRedux';

import type { CmsSortDirection, CmsViewFilter, CmsViewGroup } from '@/lib/util/index';

type SortDirection = CmsSortDirection;
type ViewFilter = CmsViewFilter;
type ViewGroup = CmsViewGroup;

/**
 * Hook for collection state and actions
 * Replaces connect() mapStateToProps/mapDispatchToProps for Collection component
 */
export function useCollection(collectionName?: string, t?: (key: string) => string) {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(state => state.collections);
  const entries = useAppSelector(state => state.entries);
  const isSearchEnabled = useAppSelector(state => state.config?.search !== false);

  const collection = useMemo(() => {
    if (collectionName) {
      return collections[collectionName];
    }
    const keys = Object.keys(collections);
    return keys.length > 0 ? collections[keys[0]] : undefined;
  }, [collections, collectionName]);

  const name = collection?.name;
  // `create` plus any collection `limit`.
  const canCreate = useAppSelector(state => !!name && selectCanCreateNewEntry(state, name));

  const sort = useMemo(
    () => (name ? selectEntriesSort(entries, name) : undefined),
    [entries, name],
  );

  const sortableFields = useMemo(
    () => (collection && t ? selectSortableFields(collection, t) : []),
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
    () => (name ? selectEntriesFilter(entries, name) : undefined),
    [entries, name],
  );

  const group = useMemo(
    () => (name ? selectEntriesGroup(entries, name) : undefined),
    [entries, name],
  );

  const viewStyle = useMemo(() => selectViewStyle(entries), [entries]);

  const newEntryUrl = useMemo(() => {
    if (canCreate && name) {
      return getNewEntryUrl(name);
    }
    return '';
  }, [canCreate, name]);

  const onSortClick = useCallback(
    (key: string, direction: SortDirection) => {
      if (collection) {
        dispatch(sortByField(collection, key, direction));
      }
    },
    [dispatch, collection],
  );

  const onFilterClick = useCallback(
    (filterValue: ViewFilter) => {
      if (collection) {
        dispatch(filterByField(collection, filterValue));
      }
    },
    [dispatch, collection],
  );

  const onGroupClick = useCallback(
    (groupValue: ViewGroup) => {
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

  return {
    collection,
    collections,
    collectionName: name,
    isSearchEnabled,
    sort,
    sortableFields,
    viewFilters,
    viewGroups,
    filter,
    group,
    viewStyle,
    newEntryUrl,
    onSortClick,
    onFilterClick,
    onGroupClick,
    onChangeViewStyle,
  };
}
