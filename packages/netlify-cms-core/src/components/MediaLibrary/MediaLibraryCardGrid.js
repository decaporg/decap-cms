import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import Waypoint from 'react-waypoint';
import MediaLibraryCard from './MediaLibraryCard';
import { colors } from 'netlify-cms-ui-default';

const CardGridContainer = styled.div`
  overflow-y: auto;
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

const MediaLibraryCardGrid = ({
  setScrollContainerRef,
  mediaItems,
  isSelectedFile,
  onAssetClick,
  canLoadMore,
  onLoadMore,
  isPaginating,
  paginatingMessage,
  cardWidth,
  cardMargin,
  isPrivate,
  getDisplayURL,
}) => (
  <CardGridContainer innerRef={setScrollContainerRef}>
    <CardGrid>
      {mediaItems.map(file => (
        <MediaLibraryCard
          key={file.key}
          isSelected={isSelectedFile(file)}
          text={file.name}
          onClick={() => onAssetClick(file)}
          width={cardWidth}
          margin={cardMargin}
          isPrivate={isPrivate}
          displayURL={getDisplayURL(file)}
        />
      ))}
      {!canLoadMore ? null : <Waypoint onEnter={onLoadMore} />}
    </CardGrid>
    {!isPaginating ? null : (
      <PaginatingMessage isPrivate={isPrivate}>{paginatingMessage}</PaginatingMessage>
    )}
  </CardGridContainer>
);

MediaLibraryCardGrid.propTypes = {
  setScrollContainerRef: PropTypes.func.isRequired,
  mediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      isViewableImage: PropTypes.bool,
      url: PropTypes.string,
      name: PropTypes.string,
    }),
  ).isRequired,
  isSelectedFile: PropTypes.func.isRequired,
  onAssetClick: PropTypes.func.isRequired,
  canLoadMore: PropTypes.bool,
  onLoadMore: PropTypes.func.isRequired,
  isPaginating: PropTypes.bool,
  paginatingMessage: PropTypes.string,
  cardWidth: PropTypes.string.isRequired,
  cardMargin: PropTypes.string.isRequired,
  getDisplayURL: PropTypes.func.isRequired,
  isPrivate: PropTypes.bool,
};

export default MediaLibraryCardGrid;
