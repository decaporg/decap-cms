import React from 'react';
import PropTypes from 'prop-types';
import { Grid, AutoSizer } from 'react-virtualized';
import MediaLibraryCard from './MediaLibraryCard';

const MediaLibraryCardGrid = ({ onAssetClick, rowCount, columnCount, getCell, selectedUuids }) => {
  function cellRenderer({ columnIndex, rowIndex, style }) {
    console.log('getCell(rowIndex, columnIndex): ', getCell(rowIndex, columnIndex));
    const file = getCell(rowIndex, columnIndex);
    return file ? (
      <MediaLibraryCard
        isSelected={selectedUuids.includes(file.uuid)}
        style={style}
        key={file.uuid}
        imageUrl={file.cdnUrl}
        text={file.name}
        onClick={() => onAssetClick(file.uuid)}
      />
    ) : (
      <div />
    );
  }

  cellRenderer.propTypes = {
    columnIndex: PropTypes.number.isRequired,
    rowIndex: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired,
  };

  return (
    <AutoSizer>
      {({ width, height }) => (
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
  );
};

MediaLibraryCardGrid.propTypes = {
  selectedUuids: PropTypes.array.isRequired,
  onAssetRemove: PropTypes.func.isRequired,
  onAssetClick: PropTypes.func.isRequired,
  getCell: PropTypes.func.isRequired,
  columnCount: PropTypes.number.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export default MediaLibraryCardGrid;
