import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Waypoint from 'react-waypoint';
import MediaLibraryCard from './MediaLibraryCard';
import { Map } from 'immutable';
import { colors } from 'netlify-cms-ui-default';

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

const MediaLibraryCardGrid = ({
  setScrollContainerRef,
  mediaItems,
  isSelectedFile,
  onAssetClick,
  canLoadMore,
  onLoadMore,
  isPaginating,
  paginatingMessage,
  cardDraftText,
  cardWidth,
  cardMargin,
  isPrivate,
  displayURLs,
  loadDisplayURL,
}) => (
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
