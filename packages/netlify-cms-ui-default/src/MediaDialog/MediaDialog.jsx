import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';

import { Button, ButtonGroup, IconButton } from '../Button';
import { Menu, MenuItem } from '../Menu';
import Dialog from '../Dialog';
import Icon from '../Icon';
import Thumbnail, { ThumbnailGrid } from '../Thumbnail';
import Table from '../Table';
import SearchBar from '../SearchBar';
import { NavMenuGroup, NavMenuGroupLabel, NavMenuItem, NavMenu } from '../NavMenu';

import getMockData from '../utils/getMockData';
import { useUIContext } from '../hooks';

const MediaDialogWrap = styled(Dialog)`
  color: ${({ theme }) => theme.color.text};
  height: 80%;
  max-height: 100%;
  max-width: 100%;
  display: flex;
  overflow: hidden;
  width: 75vw;
  height: 75vh;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    height: 100%;
  }
`;
const DialogSidebar = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;
const DialogBody = styled.div`
  background-color: ${({ theme }) => theme.color.surface};
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
`;
const DialogHeader = styled.div`
  display: flex;
  flex-direction: column;
`;
const DialogTitlebar = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 4rem;
  padding: 1rem;
`;
const DialogToolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1rem 1rem 1rem;
`;
const DialogFooter = styled.div`
  background-color: ${({ theme }) => theme.color.surface};
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  z-index: 10;
  width: 100%;
`;
const DialogFooterSelection = styled.div`
  display: flex;
  align-items: center;
  padding-top: 1rem;
  overflow-y: hidden;
  overflow-x: auto;
`;
const DialogFooterActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
`;

// TODO: Fix the height
const GalleryWrap = styled.div`
  overflow-y: auto;
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;
const CloseBtn = styled(IconButton)`
  position: absolute;
  top: 1rem;
  right: 1rem;
`;
const TitleWrap = styled.div`
  font-weight: bold;
`;
const SidebarTitle = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
  white-space: nowrap;
  margin-bottom: 0.75rem;
  margin-left: 1.125rem;
  margin-top: 0.5rem;
  line-height: 1;
`;
const MediaSearchBar = styled(SearchBar)`
  flex: 1;
  width: auto;
  margin-right: 1rem;
`;
const StyledTable = styled(Table)`
  width: 100%;
  padding-bottom: 4rem;
`;
const Title = styled.div`
  color: ${({ theme }) => theme.color.highEmphasis};
  font-weight: bold;
`;
const Subtitle = styled.div`
  font-size: 12px;
`;
const FeaturedImage = styled.div`
  background-image: url(${({ srcUrl }) => srcUrl});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  width: ${({ size }) =>
    size === 'xs' ? 1.5 : size === 'sm' ? 2 : size === 'lg' ? 3 : size === 'xl' ? 3.5 : 2.5}rem;
  height: ${({ size }) =>
    size === 'xs' ? 1.5 : size === 'sm' ? 2 : size === 'lg' ? 3 : size === 'xl' ? 3.5 : 2.5}rem;
  border-radius: 6px;
`;
const StyledThumbnailGrid = styled(ThumbnailGrid)`
  padding: 0 1rem ${({ hasSelection }) => (hasSelection ? 8 : 4)}rem 1rem;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(${({ gridView }) => (gridView ? 12 : 24)}rem, 100%), 1fr)
  );
`;
const UploadButton = styled(Button)`
  margin-bottom: 0.25rem;
  margin-left: 1rem;
  margin-right: 1rem;
`;
const SelectedCount = styled.div`
  flex: 1;
  white-space: nowrap;
  margin-right: 1rem;
  padding-left: 1rem;
`;
const SelectedImages = styled.div`
  display: flex;
  padding-right: 1rem;
  ${FeaturedImage} {
    margin-left: 0.5rem;
  }
`;

const Gallery = ({ data, gridView, activeSource, selectedItems, setSelectedItems }) => {
  const columns = React.useMemo(
    () => [
      {
        id: 'featuredImage',
        Cell({ row: { original: rowData } }) {
          return <FeaturedImage size={'md'} srcUrl={rowData.featuredImage.small} />;
        },
        width: `${3.5 * 16}px`,
      },
      {
        Header: 'Title',
        accessor: 'title',
        Cell({ row: { original: rowData } }) {
          return (
            <>
              <Title>{rowData.title}</Title>
              <Subtitle>{rowData.description}</Subtitle>
            </>
          );
        },
        width: 'auto',
      },
      {
        Header: 'Date Modified',
        accessor: 'dateModified',
        width: '15%',
      },
      {
        Header: 'Date Created',
        accessor: 'dateCreated',
        width: '15%',
      },
      {
        Header: 'Author',
        accessor: 'author',
        width: '10%',
      },
    ],
    [],
  );

  return gridView ? (
    <StyledThumbnailGrid gridView={gridView} hasSelection={!!selectedItems}>
      {data.map((thumb, i) => (
        <Thumbnail
          key={i}
          previewImgSrc={thumb.featuredImage.regular}
          title={thumb.title}
          subtitle={`${thumb.dateCreated}`}
          selectable
          selected={selectedItems.includes(thumb.id)}
          onSelect={() => {
            console.log({ selectedItems });
            if (selectedItems.includes(thumb.id)) {
              setSelectedItems(selectedItems.filter(item => item !== thumb.id));
            } else {
              setSelectedItems([...selectedItems, thumb.id]);
            }
          }}
          previewAspectRatio={'4:3'}
          width={'auto'}
          gridView={gridView}
          titleMaxLines={1}
          subtitleMaxLines={1}
        />
      ))}
    </StyledThumbnailGrid>
  ) : (
    <StyledTable
      columns={columns}
      data={data}
      rowSize={'md'}
      selectable
      onSelect={selected => setSelectedItems(selected)}
      selected={selectedItems}
      onClick={rowData => console.log(`You just clicked table row ${rowData.id}.`)}
    />
  );
};

const sources = [
  {
    id: 'media-library',
    name: 'Media Library',
    icon: 'hard-drive',
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    icon: 'unsplash',
  },
  {
    id: 'raw-pixel',
    name: 'Raw Pixel',
    icon: 'image',
  },
];

const MediaDialog = ({ open, onClose }) => {
  const [gridView, setGridView] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const placeholder = 'Search media library';
  const [activeSource, setActiveSource] = useState(sources[0]);
  const [searchMenuAnchorEl, setSearchMenuAnchorEl] = useState(null);
  const searchMenuOptions = [activeSource, { id: 'all', name: 'All Media Sources' }];
  const [selectedSearchMenuOption, setSelectedSearchMenuOption] = useState(searchMenuOptions[0]);
  const data = useMemo(() => getMockData('post', 24), [activeSource]);

  return (
    <MediaDialogWrap open={open} onClose={onClose}>
      <DialogSidebar>
        <NavMenu>
          <SidebarTitle>Choose Media</SidebarTitle>
          <NavMenuGroup>
            <NavMenuGroupLabel>Locations</NavMenuGroupLabel>
            {sources.map(source => (
              <NavMenuItem
                active={activeSource.id === source.id}
                onClick={() => {
                  setActiveSource(source);
                  if (
                    selectedSearchMenuOption.id !== 'all' &&
                    selectedSearchMenuOption.id !== source.id
                  ) {
                    setSelectedSearchMenuOption(source);
                  }
                }}
                icon={source.icon}
                key={source.name}
              >
                {source.name}
              </NavMenuItem>
            ))}
          </NavMenuGroup>
          <NavMenuGroup>
            <NavMenuGroupLabel>Media Type</NavMenuGroupLabel>
            <NavMenuItem active={false} onClick={() => null} icon="image">
              Images
            </NavMenuItem>
            <NavMenuItem active={false} onClick={() => null} icon="music">
              Music
            </NavMenuItem>
            <NavMenuItem active={false} onClick={() => null} icon="film">
              Videos
            </NavMenuItem>
            <NavMenuItem active={false} onClick={() => null} icon="file-text">
              Documents
            </NavMenuItem>
          </NavMenuGroup>
          <NavMenuGroup end>
            <UploadButton icon="upload-cloud" type="default">
              Upload New
            </UploadButton>
          </NavMenuGroup>
        </NavMenu>
      </DialogSidebar>
      <DialogBody>
        <DialogHeader>
          <DialogTitlebar>
            <TitleWrap>{activeSource.name}</TitleWrap>
            <CloseBtn icon="cross" onClick={onClose} />
          </DialogTitlebar>
          <DialogToolbar>
            <MediaSearchBar
              placeholder={placeholder}
              onChange={e => console.log(e.target.value)}
              renderEnd={() =>
                sources.length > 1 ? (
                  <>
                    <Button size="sm" hasMenu onClick={e => setSearchMenuAnchorEl(e.currentTarget)}>
                      {selectedSearchMenuOption.name}
                    </Button>
                    <Menu
                      anchorEl={searchMenuAnchorEl}
                      open={!!searchMenuAnchorEl}
                      onClose={() => setSearchMenuAnchorEl(null)}
                      anchorOrigin={{ y: 'bottom', x: 'right' }}
                    >
                      {searchMenuOptions.map(option => (
                        <MenuItem
                          key={option}
                          selected={selectedSearchMenuOption.id === option.id}
                          onClick={() => {
                            setSelectedSearchMenuOption(option);
                            setSearchMenuAnchorEl(null);
                          }}
                        >
                          {option.name}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                ) : null
              }
            />
            <ButtonGroup>
              <IconButton
                icon="bulleted-list"
                active={!gridView}
                onClick={() => setGridView(false)}
              />
              <IconButton icon="grid" active={gridView} onClick={() => setGridView(true)} />
            </ButtonGroup>
          </DialogToolbar>
        </DialogHeader>
        <GalleryWrap>
          <Gallery
            data={data}
            gridView={gridView}
            activeSource={activeSource}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        </GalleryWrap>
        <DialogFooter>
          {selectedItems?.length > 0 && (
            <DialogFooterSelection>
              <SelectedCount>
                {selectedItems?.length || 0} item{selectedItems?.length > 1 ? 's' : ''} selected
              </SelectedCount>
              <SelectedImages>
                {selectedItems
                  ?.map(item => data?.find(row => row.id === item))
                  ?.map(item => (
                    <FeaturedImage srcUrl={item?.featuredImage?.small} />
                  ))}
              </SelectedImages>
            </DialogFooterSelection>
          )}
          <DialogFooterActions>
            <ButtonGroup>
              <Button icon="trash-2" type="danger">
                Delete Selected
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button type="success" primary>
                Choose Selected
              </Button>
            </ButtonGroup>
          </DialogFooterActions>
        </DialogFooter>
      </DialogBody>
    </MediaDialogWrap>
  );
};

export default MediaDialog;
