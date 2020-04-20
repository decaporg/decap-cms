import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { FileUploadButton } from 'UI';
import { buttons, colors, colorsRaw, shadows, zIndex } from 'netlify-cms-ui-default';

const styles = {
  button: css`
    ${buttons.button};
    ${buttons.default};
    display: inline-block;
    margin-left: 15px;
    margin-right: 2px;

    &[disabled] {
      ${buttons.disabled};
      cursor: default;
    }
  `,
};

const ActionsContainer = styled.div`
  text-align: right;
`;

const StyledUploadButton = styled(FileUploadButton)`
  ${styles.button};
  ${buttons.gray};
  ${shadows.dropMain};
  margin-bottom: 0;

  span {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  input {
    height: 0.1px;
    width: 0.1px;
    margin: 0;
    padding: 0;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: ${zIndex.zIndex0};
    outline: none;
  }
`;

const DeleteButton = styled.button`
  ${styles.button};
  ${buttons.lightRed};
`;

const InsertButton = styled.button`
  ${styles.button};
  ${buttons.green};
`;

const DownloadButton = styled.button`
  ${styles.button};
  background-color: ${colors.button};
  color: ${colors.buttonText};

  ${props =>
    props.focused === true &&
    css`
      &:focus,
      &:hover {
        color: ${colorsRaw.white};
        background-color: #555a65;
      }
    `}
`;

const UpperActionsContainer = styled.div``;

const LowerActionsContainer = styled.div`
  margin-top: 30px;
`;

const MediaLibraryActions = ({
  uploadButtonLabel,
  deleteButtonLabel,
  insertButtonLabel,
  downloadButtonLabel,
  uploadEnabled,
  deleteEnabled,
  insertEnabled,
  downloadEnabled,
  insertVisible,
  imagesOnly,
  onPersist,
  onDelete,
  onInsert,
  onDownload,
}) => (
  <ActionsContainer>
    <UpperActionsContainer>
      <DownloadButton onClick={onDownload} disabled={!downloadEnabled} focused={downloadEnabled}>
        {downloadButtonLabel}
      </DownloadButton>
      <StyledUploadButton
        label={uploadButtonLabel}
        imagesOnly={imagesOnly}
        onChange={onPersist}
        disabled={!uploadEnabled}
      />
    </UpperActionsContainer>
    <LowerActionsContainer>
      <DeleteButton onClick={onDelete} disabled={!deleteEnabled}>
        {deleteButtonLabel}
      </DeleteButton>
      {!insertVisible ? null : (
        <InsertButton onClick={onInsert} disabled={!insertEnabled}>
          {insertButtonLabel}
        </InsertButton>
      )}
    </LowerActionsContainer>
  </ActionsContainer>
);

MediaLibraryActions.propTypes = {
  uploadButtonLabel: PropTypes.string.isRequired,
  deleteButtonLabel: PropTypes.string.isRequired,
  insertButtonLabel: PropTypes.string.isRequired,
  downloadButtonLabel: PropTypes.string.isRequired,
  uploadEnabled: PropTypes.bool,
  deleteEnabled: PropTypes.bool,
  insertEnabled: PropTypes.bool,
  insertVisible: PropTypes.bool,
  downloadEnabled: PropTypes.bool,
  imagesOnly: PropTypes.bool,
  onPersist: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onInsert: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
};

export default MediaLibraryActions;
