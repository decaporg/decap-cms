import React, { useState } from 'react';
import { translate } from 'react-polyglot';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import {
  AppBar,
  Button,
  Menu,
  MenuItem,
  SearchBar,
  LogoTile,
  UserMenu,
  NotificationCenter,
} from 'decap-cms-ui-next';

import { searchCollections } from '../../actions/collections';

const StyledUserMenu = styled(UserMenu)`
  margin-left: 0.75rem;
`;

const RenderEndWrap = styled.div`
  display: flex;
  gap: 1rem;
  flex: 1;
`;

const SearchWrap = styled.div`
  width: 100%;
`;

function Header({ user, collections, onLogoutClick, onCreateEntryClick, isSearchEnabled, t }) {
  const creatableCollections = collections.filter(collection => !collection.get('create')).toList();
  const searcheableCollections = collections.filter(collection => !collection.get('url')).toList();

  const [quickAddMenuAnchorEl, setQuickAddMenuAnchorEl] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [collectionMenuAnchorEl, setCollectionMenuAnchorEl] = useState(null);
  const [selectedCollectionIdx, setSelectedCollectionIdx] = useState(
    getSelectedSelectionBasedOnProps(),
  );

  function getSelectedSelectionBasedOnProps() {
    const location = useLocation();

    const pathnameArray = location.pathname.split('/');
    let pathname = '';

    if (pathnameArray[1] === 'collections') {
      pathname = pathnameArray[2];
    } else {
      pathname = null;
    }

    return pathname ? collections.keySeq().indexOf(pathname) : -1;
  }

  function handleCreatePostClick(collectionName) {
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  }

  function submitSearch() {
    if (selectedCollectionIdx !== -1) {
      searchCollections(
        searchTerm,
        collections.toIndexedSeq().getIn([selectedCollectionIdx, 'name']),
      );
    } else {
      searchCollections(searchTerm);
    }
  }

  return (
    <AppBar
      // renderStart={LogoTile}
      renderEnd={() => {
        return (
          <RenderEndWrap>
            {isSearchEnabled && (
              <SearchWrap>
                <SearchBar
                  placeholder={t('collection.sidebar.searchAll')}
                  onChange={event => setSearchTerm(event.currentTarget.value)}
                  onSubmit={submitSearch}
                  renderEnd={() => (
                    <>
                      <Button
                        size="sm"
                        hasMenu
                        onClick={e => setCollectionMenuAnchorEl(e.currentTarget)}
                      >
                        {selectedCollectionIdx !== -1
                          ? collections.toIndexedSeq().get(selectedCollectionIdx).get('label')
                          : t('collection.sidebar.allCollections')}
                      </Button>

                      <Menu
                        anchorEl={collectionMenuAnchorEl}
                        anchorOrigin={{ y: 'bottom', x: 'right' }}
                        open={!!collectionMenuAnchorEl}
                        onClose={() => setCollectionMenuAnchorEl(null)}
                      >
                        <MenuItem
                          selected={selectedCollectionIdx === -1}
                          onClick={() => {
                            setSelectedCollectionIdx(-1);
                            setCollectionMenuAnchorEl(null);
                          }}
                        >
                          {t('collection.sidebar.allCollections')}
                        </MenuItem>

                        {searcheableCollections.toIndexedSeq().map((collection, idx) => (
                          <MenuItem
                            key={idx}
                            selected={selectedCollectionIdx === idx}
                            onClick={() => {
                              setSelectedCollectionIdx(idx);
                              setCollectionMenuAnchorEl(null);
                            }}
                          >
                            {collection.get('label')}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                />
              </SearchWrap>
            )}

            <div>
              <Button icon="plus" hasMenu onClick={e => setQuickAddMenuAnchorEl(e.currentTarget)}>
                {t('app.header.quickAdd')}
              </Button>

              <Menu
                anchorEl={quickAddMenuAnchorEl}
                anchorOrigin={{ y: 'bottom', x: 'right' }}
                open={!!quickAddMenuAnchorEl}
                onClose={() => setQuickAddMenuAnchorEl(null)}
              >
                {creatableCollections.map(collection => (
                  <MenuItem
                    key={collection.get('name')}
                    onClick={() => {
                      setQuickAddMenuAnchorEl(null);
                      handleCreatePostClick(collection.get('name'));
                    }}
                  >
                    {collection.get('label_singular') || collection.get('label')}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </RenderEndWrap>
        );
      }}
      renderActions={() => (
        <>
          <NotificationCenter />
          <StyledUserMenu user={user} onLogoutClick={onLogoutClick} />
        </>
      )}
    ></AppBar>
  );
}

function mapStateToProps(state) {
  const { collections, user } = state;
  const isSearchEnabled = state.config && state.config.search != false;

  return {
    collections,
    user,
    isSearchEnabled,
  };
}

const ConnectedHeader = connect(mapStateToProps)(Header);

export default translate()(ConnectedHeader);
