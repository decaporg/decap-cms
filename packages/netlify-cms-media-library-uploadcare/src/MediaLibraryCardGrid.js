import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import Waypoint from 'react-waypoint';
import MediaLibraryCard from './MediaLibraryCard';
import { colors } from 'netlify-cms-ui-default';

const CardGrid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  overflow: auto;
`;

const MediaLibraryCardGrid = ({
  mediaItems,
  onAssetClick,
}) => (
  <CardGrid>
    {mediaItems.map(file => (
      <MediaLibraryCard
        key={file.uuid}
        imageUrl={file.url}
        text={file.name}
        onClick={() => onAssetClick(file.uuid)}
      />
    ))}
  </CardGrid>
);

MediaLibraryCardGrid.propTypes = {
  mediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      uuid: PropTypes.string.isRequired,
      original_filename: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired
    }),
  ).isRequired,
  onAssetClick: PropTypes.func.isRequired
};

export default MediaLibraryCardGrid;
