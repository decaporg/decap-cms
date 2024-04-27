import { ThumbnailGrid, Thumbnail } from 'decap-cms-ui-next';
import React from 'react';

function MediaGallery({ mediaItems, isSelectedFile }) {
  console.log('mediaItems', mediaItems);

  return (
    <ThumbnailGrid>
      {mediaItems.map(file => {
        return (
          <Thumbnail key={file.key} previewImgSrc={file} selected={isSelectedFile(file)}>
            <img src={file.url} alt={file.name} />
          </Thumbnail>
        );
      })}
    </ThumbnailGrid>
  );
}

export default MediaGallery;
