import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Waypoint from 'react-waypoint';
import MediaLibraryCard from './MediaLibraryCard';
import { Map } from 'immutable';
import { colors } from 'netlify-cms-ui-legacy';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const CardWrapper = props => {
  const {
    rowIndex,
    columnIndex,
    style,
    data: {
      mediaItems,
      isSelectedFile,
      onAssetClick,
      cardDraftText,
      cardWidth,
      cardHeight,
      isPrivate,
      displayURLs,
      loadDisplayURL,
      columnCount,
      gutter,
    },
  } = props;
  const index = rowIndex * columnCount + columnIndex;
  if (index >= mediaItems.length) {
    return null;
  }
  const file = mediaItems[index];

  return (
    <div
      style={{
        ...style,
        left: style.left + gutter * columnIndex,
        top: style.top + gutter,
        width: style.width - gutter,
        height: style.height - gutter,
      }}
    >
      <MediaLibraryCard
        key={file.key}
        isSelected={isSelectedFile(file)}
        text={file.name}
        onClick={() => onAssetClick(file)}
        isDraft={file.draft}
        draftText={cardDraftText}
        width={cardWidth}
        height={cardHeight}
        margin={'0px'}
        isPrivate={isPrivate}
        displayURL={displayURLs.get(file.id, file.url ? Map({ url: file.url }) : Map())}
        loadDisplayURL={() => loadDisplayURL(file)}
        type={file.type}
        isViewableImage={file.isViewableImage}
      />
    </div>
  );
};

const VirtualizedGrid = props => {
  const { mediaItems, setScrollContainerRef } = props;

  return (
    <CardGridContainer ref={setScrollContainerRef}>
      <AutoSizer>
        {({ height, width }) => {
          const cardWidth = parseInt(props.cardWidth, 10);
          const cardHeight = parseInt(props.cardHeight, 10);
          const gutter = parseInt(props.cardMargin, 10);
          const columnWidth = cardWidth + gutter;
          const rowHeight = cardHeight + gutter;
          const columnCount = Math.floor(width / columnWidth);
          const rowCount = Math.ceil(mediaItems.length / columnCount);
          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              height={height}
              itemData={{ ...props, gutter, columnCount }}
            >
              {CardWrapper}
            </Grid>
          );
        }}
      </AutoSizer>
    </CardGridContainer>
  );
};

const PaginatedGrid = ({
  setScrollContainerRef,
  mediaItems,
  isSelectedFile,
  onAssetClick,
  cardDraftText,
  cardWidth,
  cardHeight,
  cardMargin,
  isPrivate,
  displayURLs,
  loadDisplayURL,
  canLoadMore,
  onLoadMore,
  isPaginating,
  paginatingMessage,
}) => {
  return (
    <CardGridContainer ref={setScrollContainerRef}>
      <CardGrid>
        {mediaItems.map(file => (
          <MediaLibraryCard
            key={file.key}
            isSelected={isSelectedFile(file)}
            text={file.name}
            onClick={() => onAssetClick(file)}
            isDraft={file.draft}
            draftText={cardDraftText}
            width={cardWidth}
            height={cardHeight}
            margin={cardMargin}
            isPrivate={isPrivate}
            displayURL={displayURLs.get(file.id, file.url ? Map({ url: file.url }) : Map())}
            loadDisplayURL={() => loadDisplayURL(file)}
            type={file.type}
            isViewableImage={file.isViewableImage}
          />
        ))}
        {!canLoadMore ? null : <Waypoint onEnter={onLoadMore} />}
      </CardGrid>
      {!isPaginating ? null : (
        <PaginatingMessage isPrivate={isPrivate}>{paginatingMessage}</PaginatingMessage>
      )}
    </CardGridContainer>
  );
};

const CardGridContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
`;

const CardGrid = styled.div`
  display: flex;
  flex-wrap: wrap;

  margin-left: -10px;
  margin-right: -10px;
`;

const PaginatingMessage = styled.h1`
  color: ${props => props.isPrivate && colors.textFieldBorder};
`;

const MediaLibraryCardGrid = props => {
  const { canLoadMore, isPaginating } = props;
  if (canLoadMore || isPaginating) {
    return <PaginatedGrid {...props} />;
  }
  return <VirtualizedGrid {...props} />;
};

MediaLibraryCardGrid.propTypes = {
  setScrollContainerRef: PropTypes.func.isRequired,
  mediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      displayURL: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      id: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      draft: PropTypes.bool,
    }),
  ).isRequired,
  isSelectedFile: PropTypes.func.isRequired,
  onAssetClick: PropTypes.func.isRequired,
  canLoadMore: PropTypes.bool,
  onLoadMore: PropTypes.func.isRequired,
  isPaginating: PropTypes.bool,
  paginatingMessage: PropTypes.string,
  cardDraftText: PropTypes.string.isRequired,
  cardWidth: PropTypes.string.isRequired,
  cardMargin: PropTypes.string.isRequired,
  loadDisplayURL: PropTypes.func.isRequired,
  isPrivate: PropTypes.bool,
  displayURLs: PropTypes.instanceOf(Map).isRequired,
};

export default MediaLibraryCardGrid;
