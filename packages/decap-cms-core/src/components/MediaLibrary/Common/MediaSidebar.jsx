import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import {
  FileUploadButton,
  NavMenu,
  NavMenuItem,
  NavMenuGroup,
  NavMenuGroupLabel,
} from 'decap-cms-ui-next';

const MediaSidebarWrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  ${({ theme }) => theme.responsive.mediaQueryDown('xs')} {
    display: none;
  }
`;

const UploadButton = styled(FileUploadButton)`
  padding: 0 1rem;
  width: 100%;
`;

function MediaSidebar({
  t,
  sources,
  activeSource,
  setActiveSource,
  selectedSearchMenuOption,
  setSelectedSearchMenuOption,
  isPersisting,
  onUpload,
  imagesOnly,
}) {
  const uploadEnabled = !isPersisting;
  const uploadButtonLabel = isPersisting
    ? t('mediaLibrary.mediaLibraryModal.uploading')
    : t('mediaLibrary.mediaLibraryModal.upload');

  return (
    <MediaSidebarWrap>
      <NavMenu>
        {/* <SidebarTitle>Choose Media</SidebarTitle> */}

        {/* <NavMenuGroup>
          <NavMenuGroupLabel>Locations</NavMenuGroupLabel>
          {sources.map(source => (
            <NavMenuItem
              active={activeSource.id === source.id}
              onClick={() => {
                setActiveSource(source);
                if (
                  selectedSearchMenuOption.id !== 'all' &&
                  selectedSearchMenuOption.id !== source.id
                ) {
                  setSelectedSearchMenuOption(source);
                }
              }}
              icon={source.icon}
              key={source.name}
            >
              {source.name}
            </NavMenuItem>
          ))}
        </NavMenuGroup> */}

        <NavMenuGroup>
          <NavMenuGroupLabel>Media Type</NavMenuGroupLabel>
          <NavMenuItem active={false} onClick={() => null} icon="image">
            Images
          </NavMenuItem>
          <NavMenuItem active={false} onClick={() => null} icon="music">
            Music
          </NavMenuItem>
          <NavMenuItem active={false} onClick={() => null} icon="film">
            Videos
          </NavMenuItem>
          <NavMenuItem active={false} onClick={() => null} icon="file-text">
            Documents
          </NavMenuItem>
        </NavMenuGroup>

        <NavMenuGroup end>
          <FileUploadButton
            label={uploadButtonLabel}
            accept={imagesOnly ? 'image/*' : '*/*'}
            onChange={onUpload}
            disabled={!uploadEnabled}
          />
        </NavMenuGroup>
      </NavMenu>
    </MediaSidebarWrap>
  );
}

MediaSidebar.propTypes = {
  t: PropTypes.func.isRequired,
  isPersisting: PropTypes.bool.isRequired,
  onUpload: PropTypes.func.isRequired,
  imagesOnly: PropTypes.bool,
};

export default MediaSidebar;
