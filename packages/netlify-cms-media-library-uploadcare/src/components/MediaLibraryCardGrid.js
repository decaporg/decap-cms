import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import {
  Grid,
  AutoSizer
} from 'react-virtualized'
import MediaLibraryCard from './MediaLibraryCard';


const CardGrid = styled(Grid)`
  overflow: auto;
`;

const MediaLibraryCardGrid = ({
  onAssetClick,
  rowCount,
  columnCount,
  getCell,
  removeFile,
}) => {

  function cellRenderer({columnIndex, key, rowIndex, style, isVisible}) {
    console.log('getCell(rowIndex, columnIndex): ', getCell(rowIndex, columnIndex))
    const file = getCell(rowIndex, columnIndex)
    return file ?
      <MediaLibraryCard
        onRemove={() => removeFile(file.uuid)}
        style={style}
        key={file.uuid}
        imageUrl={file.cdnUrl}
        text={file.name}
        onClick={() => onAssetClick(file.uuid)}
      /> : <div/>
  }

  return (
    <AutoSizer>
      {({width, height}) => (
        <Grid
          cellRenderer={cellRenderer}
          height={height}
          width={width}
          overscanRowCount={3}
          columnWidth={195}
          rowHeight={200}
          rowCount={rowCount}
          columnCount={columnCount}
          scrollToColumn={0}
          scrollToRow={0}
        />
      )}
    </AutoSizer>
  )
}

MediaLibraryCardGrid.propTypes = {
  mediaItems: PropTypes.arrayOf(
    PropTypes.shape({
      cdnUrl: PropTypes.string.isRequired,
      uuid: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired
    }),
  ).isRequired,
  onAssetClick: PropTypes.func.isRequired
};

export default MediaLibraryCardGrid;
