import React, { useState } from 'react';
import styled from '@emotion/styled';

import { Button, ButtonGroup, IconButton } from '../Button';
import { Menu, MenuItem } from '../Menu';
import Card from '../Card';
import Icon from '../Icon';
import Thumbnail, { ThumbnailGrid } from '../Thumbnail';
import getMockData from '../utils/getMockData';
import SearchBar from '../SearchBar';
import { NavMenuGroup, NavMenuItem, NavMenu } from '../NavMenu';
import { useUIContext } from '../hooks';

const MediaDialogWrap = styled(Card)`
  color: ${({ theme }) => theme.color.text};
  height: 80%;
  max-height: 100%;
  display: flex;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    height: 100%;
  }
`;

const SideWrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;

const MainWrap = styled.div`
  background-color: ${({ theme }) => theme.color.background};
  position: relative;
`;

const ActionsTopWrap = styled.div`
  display: flex;
  padding: 1rem;
  & > * + * {
    margin-left: 1rem;
  }
`;

const ActionsBottomWrap = styled.div`
  background-color: ${({ theme }) => theme.color.background};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 1rem;
  z-index: 10;
`;

const HeaderWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 3rem;
`;

const SourceWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  & > a {
    white-space: nowrap;
  }
`;

// TODO: Fix the height
const GalleryWrap = styled.div`
  overflow-y: auto;
  height: calc(100% - 10rem);
  padding: 1rem;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;

const CloseBtn = styled(IconButton)`
  position: absolute;
  top: calc(50%-20px);
  right: 0.8rem;
`;

const Collapsable = props => {
  const { navCollapsed } = useUIContext();
  return navCollapsed ? null : props.children;
};

const AddSrcBtn = styled(Button)`
  position: absolute;
  bottom: 4rem;
  align-self: center;
`;
const TitleWrap = styled.div`
  font-weight: bold;
`;

const SideBarTitle = styled.div`
  font-weight: bold;
  font-size: 1.5rem;
  white-space: nowrap;
  align-self: center;
  margin-bottom: 1rem;
`;

// TODO: Pass the selected state up so that it can be used by Delete & Choose Selected button
const StoryThumbnail = ({
  previewImgSrc,
  previewBgColor,
  previewText,
  title,
  subtitle,
  selectable,
  previewAspectRatio,
  horizontal,
  titleMaxLines,
  subtitleMaxLines,
  width,
  height,
  onClick,
}) => {
  const [selected, setSelected] = useState(false);

  return (
    <Thumbnail
      previewImgSrc={previewImgSrc}
      previewBgColor={previewBgColor}
      previewText={previewText}
      title={title}
      subtitle={subtitle}
      selectable={selectable}
      selected={selected}
      horizontal={horizontal}
      titleMaxLines={titleMaxLines}
      subtitleMaxLines={subtitleMaxLines}
      onSelect={() => setSelected(!selected)}
      previewAspectRatio={previewAspectRatio}
      width={width}
      height={height}
      onClick={onClick}
    />
  );
};

const StyledThumbnailGrid = styled(ThumbnailGrid)`
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(${({ horizontal }) => (horizontal ? 24 : 12)}rem, 100%), 1fr)
  );
`;

const Gallery = ({ horizontal }) => {
  const mockData = getMockData('post', 19);
  const selectable = true;
  const onClick = true;
  const previewAspectRatio = '4:3';
  const previewImgSrc = true;
  const supertitle = true;
  const title = true;
  const description = true;
  const subtitle = true;
  const titleMaxLines = 1;
  const subtitleMaxLines = 1;
  return (
    <StyledThumbnailGrid horizontal={horizontal}>
      {mockData.map((thumb, i) => (
        <StoryThumbnail
          key={i}
          previewImgSrc={previewImgSrc && thumb.featuredImage.regular}
          title={title && thumb.title}
          subtitle={subtitle && `${thumb.dateCreated}`}
          selectable={selectable}
          previewAspectRatio={previewAspectRatio}
          width={'auto'}
          horizontal={horizontal}
          titleMaxLines={titleMaxLines}
          subtitleMaxLines={subtitleMaxLines}
        />
      ))}
    </StyledThumbnailGrid>
  );
};

const SideBar = () => {
  const collapsable = true;
  const [activeItemId, setActiveItemId] = useState('Media Library');
  const sources = [
    {
      name: 'Media Library',
      icon: 'database',
    },
    {
      name: 'Unsplash',
      icon: 'image',
    },
    {
      name: 'Raw Pixel',
      icon: 'image',
    },
  ];

  return (
    <SideWrap>
      <NavMenu collapsable={collapsable}>
        <Collapsable>
          <SideBarTitle>Choose Source</SideBarTitle>
        </Collapsable>
        {sources.map(el => (
          <NavMenuItem
            active={activeItemId === el.name}
            onClick={() => setActiveItemId(el.name)}
            icon={el.icon}
            key={el.name}
          >
            {el.name}
          </NavMenuItem>
        ))}
        <Collapsable>
          <AddSrcBtn icon="plus">Add Source</AddSrcBtn>
        </Collapsable>
      </NavMenu>
    </SideWrap>
  );
};

const MediaDialog = props => {
  const [horizontal, setHorizontal] = useState(false);
  const [open, setOpen] = useState(false);
  const renderEnd = true;
  const placeholder = 'Search media library';

  return open ? (
    <MediaDialogWrap>
      <SideBar />
      <MainWrap>
        <HeaderWrap>
          <TitleWrap>Media Library</TitleWrap>
          <CloseBtn icon="cross" onClick={() => setOpen(false)} />
        </HeaderWrap>
        <ActionsTopWrap>
          <SearchBar
            placeholder={placeholder}
            renderEnd={renderEnd ? () => <EndContent /> : null}
            onChange={e => console.log(e.target.value)}
          />
          <IconButton icon="bulleted-list" onClick={() => setHorizontal(true)} />
          <IconButton icon="grid" onClick={() => setHorizontal(false)} />
        </ActionsTopWrap>
        <GalleryWrap>
          <Gallery horizontal={horizontal} />
        </GalleryWrap>
        <ActionsBottomWrap>
          <ButtonGroup>
            <Button icon="upload-cloud" type="default">
              Upload New
            </Button>
            <Button icon="trash-2" type="danger">
              Delete Selected
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <Button
              type="default"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="success" primary>
              Choose Selected
            </Button>
          </ButtonGroup>
        </ActionsBottomWrap>
      </MainWrap>
    </MediaDialogWrap>
  ) : (
    <Button
      onClick={() => {
        setOpen(true);
      }}
    >
      Media Library
    </Button>
  );
};

export default MediaDialog;

const EndContent = () => {
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Posts');
  const categories = ['Posts', 'Media', 'Pages', 'Products', 'Authors', 'Everywhere'];
  function handleClose() {
    setCategoryMenuAnchorEl(null);
  }
  return (
    <>
      <Button size="sm" hasMenu onClick={e => setCategoryMenuAnchorEl(e.currentTarget)}>
        {selectedCategory}
      </Button>
      <Menu
        anchorEl={categoryMenuAnchorEl}
        open={!!categoryMenuAnchorEl}
        onClose={() => setCategoryMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {categories.map(category => (
          <MenuItem
            key={category}
            selected={selectedCategory === category}
            onClick={() => {
              setSelectedCategory(category);
              handleClose();
            }}
          >
            {category}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
