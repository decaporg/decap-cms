import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
`;

const SearchWrap = styled.div`
  width: 33vw;
`;

function Header({ collections, logoutUser, t }) {
  const creatableCollections = collections.filter(collection => collection.get('create')).toList();

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
      renderStart={LogoTile}
      renderEnd={() => {
        return (
          <RenderEndWrap>
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

                      {collections.toIndexedSeq().map((collection, idx) => (
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
                      history.push(`/collections/${collection.get('name')}/new`);
                    }}
                  >
                    {collection.get('label')}
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
          <StyledUserMenu onLogoutClick={logoutUser} />
        </>
      )}
    ></AppBar>
  );
}

export default Header;
