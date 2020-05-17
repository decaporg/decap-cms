import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { useUIContext, Menu, MenuItem, ButtonGroup, Button } from 'netlify-cms-ui-default';
import { getNewEntryUrl } from 'Lib/urlHelper';
import CollectionTop from './CollectionTop';
import CollectionSearch from './CollectionSearch';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import { selectSortableFields } from 'Reducers/collections';
import { selectEntriesSort } from 'Reducers/entries';
import { VIEW_STYLE_LIST } from 'Constants/collectionViews';
import { createNewEntry } from 'Actions/collections';

const CollectionContainer = styled.div`
  margin: 1rem;
`;

const CollectionMain = styled.main``;

const Collection = ({
  collection,
  collections,
  collectionName,
  isSearchResults,
  searchTerm,
  t,
}) => {
  const [viewStyle, setViewStyle] = useState(VIEW_STYLE_LIST);
  const { setPageTitle, setBreadcrumbs, renderAppBarEnd } = useUIContext();
  const renderEntriesCollection = () => (
    <EntriesCollection collection={collection} viewStyle={viewStyle} />
  );
  const renderEntriesSearch = () => (
    <EntriesSearch collections={collections} searchTerm={searchTerm} />
  );
  const handleChangeViewStyle = newViewStyle =>
    viewStyle !== newViewStyle && setViewStyle(newViewStyle);
  const newEntryUrl = collection.get('create') ? getNewEntryUrl(collectionName) : '';

  useEffect(() => {
    setPageTitle(null);
    setBreadcrumbs([
      {
        label: 'My Website',
        onClick: () => {
          history.push('/');
        },
      },
      { label: collection.get('label') },
    ]);
    renderAppBarEnd(() => (
      <>
        <CollectionSearch t={t} />
        <CollectionsAppBarActions collections={collections} t={t} />
      </>
    ));
  }, [collection]);

  return (
    <CollectionContainer>
      <CollectionMain>
        {isSearchResults ? null : (
          <CollectionTop
            collection={collection}
            collectionLabel={collection.get('label')}
            collectionLabelSingular={collection.get('label_singular')}
            collectionDescription={collection.get('description')}
            newEntryUrl={newEntryUrl}
            viewStyle={viewStyle}
            onChangeViewStyle={handleChangeViewStyle}
          />
        )}
        {isSearchResults ? renderEntriesSearch() : renderEntriesCollection()}
      </CollectionMain>
    </CollectionContainer>
  );
};

Collection.propTypes = {
  searchTerm: PropTypes.string,
  collectionName: PropTypes.string,
  isSearchResults: PropTypes.bool,
  collection: ImmutablePropTypes.map.isRequired,
  collections: ImmutablePropTypes.orderedMap.isRequired,
};

function mapStateToProps(state, ownProps) {
  const { collections } = state;
  const { isSearchResults, match, t } = ownProps;
  const { name, searchTerm } = match.params;
  const collection = name ? collections.get(name) : collections.first();
  const sort = selectEntriesSort(state.entries, collection.get('name'));
  const sortableFields = selectSortableFields(collection, t);

  return {
    collection,
    collections,
    collectionName: name,
    isSearchResults,
    searchTerm,
    sort,
    sortableFields,
  };
}

export const CollectionsAppBarActions = ({ collections, t }) => {
  const createableCollections = collections.filter(collection => collection.get('create')).toList();
  const [createMenuAnchorEl, setCreateMenuAnchorEl] = useState();
  const handleCreatePostClick = collectionName => {
    setCreateMenuAnchorEl(null);
    createNewEntry(collectionName);
  };

  return (
    <>
      {createableCollections.size > 0 && (
        <>
          <ButtonGroup>
            <Button primary onClick={e => setCreateMenuAnchorEl(e.currentTarget)} hasMenu>
              {t('app.header.quickAdd')}
            </Button>
          </ButtonGroup>
          <Menu
            anchorEl={createMenuAnchorEl}
            open={!!createMenuAnchorEl}
            onClose={() => setCreateMenuAnchorEl(null)}
          >
            {createableCollections.map(collection => (
              <MenuItem
                key={collection.get('name')}
                icon={collection.get('icon') || 'edit-3'}
                onClick={() => handleCreatePostClick(collection.get('name'))}
              >
                {collection.get('label_singular') || collection.get('label')}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </>
  );
};

export default connect(mapStateToProps)(Collection);
