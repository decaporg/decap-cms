import React from 'react';
import { ButtonGroup, Button, FileUploadButton } from 'decap-cms-ui-next';

function MediaControls({
  isDialog,
  onSelect,
  hasSelection,
  selectedButtonLabel,
  onDelete,
  deleteEnabled,
  deleteButtonLabel,
  onUpload,
  uploadEnabled,
  uploadButtonLabel,
  imagesOnly,
}) {
  return (
    <ButtonGroup>
      {isDialog && (
        <>
          {/* <Button type="danger" onClick={onDelete} disabled={!deleteEnabled} icon="trash-2">
            {deleteButtonLabel}
          </Button> */}

          <Button type="success" primary onClick={onSelect} disabled={!hasSelection} icon="check">
            {selectedButtonLabel}
          </Button>
        </>
      )}

      <FileUploadButton
        label={uploadButtonLabel}
        accept={imagesOnly ? 'image/*' : '*/*'}
        onChange={onUpload}
        disabled={!uploadEnabled}
      />
    </ButtonGroup>
  );
}

export default MediaControls;
