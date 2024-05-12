import React from 'react';
import { ThumbnailGrid, Thumbnail } from 'decap-cms-ui-next';

function MediaGallery({ mediaItems, isSelectedFile, onAssetClick, loadDisplayURL }) {
  console.log('mediaItems', mediaItems);

  return (
    <ThumbnailGrid>
      {mediaItems.map(file => {
        const { displayURL } = file;

        console.log('file', file);

        if (!displayURL) {
          loadDisplayURL(file);
        }

        return (
          <Thumbnail
            key={file.key}
            previewImgSrc={displayURL}
            title={file.name}
            selectable
            selected={isSelectedFile(file)}
            onSelect={() => onAssetClick(file)}
          />
        );
      })}
    </ThumbnailGrid>
  );
}

export default MediaGallery;
