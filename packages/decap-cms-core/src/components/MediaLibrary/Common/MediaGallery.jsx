import React from 'react';
import styled from '@emotion/styled';
import {
  ThumbnailGrid,
  Thumbnail,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  Button,
} from 'decap-cms-ui-next';

const ActionsWrap = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1;

  /* display: none; */
`;

// const StyledThumbnail = styled(Thumbnail)`
//   &:hover ${ActionsWrap} {
//     display: block;
//   }
// `;

function MediaGallery({
  mediaItems,
  isSelectedFile,
  selectable,
  onAssetClick,
  loadDisplayURL,
  draftText,
}) {
  return (
    <ThumbnailGrid>
      {mediaItems.map(file => {
        if (!file.displayURL) {
          loadDisplayURL(file);
        }

        return (
          <Thumbnail
            key={file.key}
            previewImgSrc={file.displayURL}
            supertitle={file.draft ? draftText : null}
            title={file.name}
            selectable={selectable}
            selected={isSelectedFile(file)}
            onSelect={() => onAssetClick(file)}
            renderActions={() => (
              <ActionsWrap>
                <Dropdown>
                  <DropdownTrigger>
                    <Button primary icon="more-vertical" />
                  </DropdownTrigger>

                  <DropdownMenu>
                    <DropdownMenuItem icon="copy">Copy</DropdownMenuItem>
                    <DropdownMenuItem icon="download">Download</DropdownMenuItem>
                    <DropdownMenuItem icon="trash-2" type="danger">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenu>
                </Dropdown>
              </ActionsWrap>
            )}
          />
        );
      })}
    </ThumbnailGrid>
  );
}

export default MediaGallery;
