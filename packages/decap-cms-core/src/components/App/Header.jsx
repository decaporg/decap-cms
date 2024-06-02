import React, { useState } from 'react';
import { translate } from 'react-polyglot';
import { useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import {
  AppBar,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  SearchBar,
  UserMenu,
  NotificationCenter,
} from 'decap-cms-ui-next';

import { searchCollections } from '../../actions/collections';

const StyledAppBar = styled(AppBar)`
  z-index: 1;
`;

const StyledUserMenu = styled(UserMenu)`
  margin-left: 0.75rem;
`;

const RenderEndWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const SearchWrap = styled.div`
  width: 100%;
  padding-left: 1rem;
`;

function Header({ user, collections, onLogoutClick, onCreateEntryClick, isSearchEnabled, t }) {
  const creatableCollections = collections.filter(collection => collection.get('create')).toList();
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
    <StyledAppBar
      // renderStart={LogoTile}
      renderEnd={() => {
        return (
          <RenderEndWrap>
            {isSearchEnabled && (
              <SearchWrap>
                <SearchBar
                  placeholder={
                    selectedCollectionIdx !== -1
                      ? t('collection.sidebar.searchIn') +
                        ' ' +
                        collections.toIndexedSeq().get(selectedCollectionIdx).get('label')
                      : t('collection.sidebar.searchAll')
                  }
                  onChange={event => setSearchTerm(event.currentTarget.value)}
                  onSubmit={submitSearch}
                  renderEnd={() => (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button size="sm" hasMenu>
                          {selectedCollectionIdx !== -1
                            ? collections.toIndexedSeq().get(selectedCollectionIdx).get('label')
                            : t('collection.sidebar.allCollections')}
                        </Button>
                      </DropdownTrigger>

                      <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
                        <DropdownMenuItem
                          selected={selectedCollectionIdx === -1}
                          onClick={() => {
                            setSelectedCollectionIdx(-1);
                            setCollectionMenuAnchorEl(null);
                          }}
                        >
                          {t('collection.sidebar.allCollections')}
                        </DropdownMenuItem>

                        {searcheableCollections.toIndexedSeq().map((collection, idx) => (
                          <DropdownMenuItem
                            key={idx}
                            selected={selectedCollectionIdx === idx}
                            onClick={() => {
                              setSelectedCollectionIdx(idx);
                              setCollectionMenuAnchorEl(null);
                            }}
                            icon={
                              collection.get('icon') ??
                              (collection.get('type') === 'file_based_collection'
                                ? 'file'
                                : 'folder')
                            }
                          >
                            {collection.get('label')}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                />
              </SearchWrap>
            )}

            <Dropdown>
              <DropdownTrigger>
                <Button icon="plus" hasMenu>
                  {t('app.header.quickAdd')}
                </Button>
              </DropdownTrigger>

              <DropdownMenu anchorOrigin={{ y: 'bottom', x: 'right' }}>
                {creatableCollections.map(collection => (
                  <DropdownMenuItem
                    key={collection.get('name')}
                    icon={collection.get('icon') || 'file-text'}
                    onClick={() => {
                      handleCreatePostClick(collection.get('name'));
                    }}
                  >
                    {t('collection.collectionTop.newButton', {
                      collectionLabel: collection.get('label_singular') || collection.get('label'),
                    })}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </RenderEndWrap>
        );
      }}
      renderActions={() => (
        <>
          <NotificationCenter />
          <StyledUserMenu user={user} onLogoutClick={onLogoutClick} />
        </>
      )}
    ></StyledAppBar>
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
